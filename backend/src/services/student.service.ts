import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { encrypt } from '../utils/encryption.util';
import { validatePassword } from '../utils/validation.util';

const prisma = new PrismaClient();

const MAX_BULK_CREATE = 100;

// Student accounts are always anonymous by design: the instructor never
// types a username, so no real name/PII can end up in one.
const USERNAME_ADJECTIVES = ['quick', 'bright', 'calm', 'bold', 'keen', 'swift', 'wise', 'fair', 'warm', 'cool'];
const USERNAME_NOUNS = ['fox', 'owl', 'hawk', 'wolf', 'bear', 'deer', 'lynx', 'dove', 'lion', 'elk'];

function generateAnonymousUsername(): string {
  const adjective = USERNAME_ADJECTIVES[Math.floor(Math.random() * USERNAME_ADJECTIVES.length)];
  const noun = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];
  const number = Math.floor(Math.random() * 900) + 100;
  return `${adjective}-${noun}-${number}`;
}

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

async function uniqueUsername(): Promise<string> {
  let username = generateAnonymousUsername();
  for (let attempt = 0; attempt < 5; attempt++) {
    const collision = await prisma.user.findUnique({ where: { username } });
    if (!collision) break;
    username = generateAnonymousUsername();
  }
  return username;
}

export class StudentService {
  async bulkCreateStudents(
    instructorId: string,
    count: number,
    opts: { classId?: string | null; password?: string } = {}
  ): Promise<Array<{ username: string; password: string }>> {
    if (!Number.isInteger(count) || count < 1 || count > MAX_BULK_CREATE) {
      throw new Error(`Count must be between 1 and ${MAX_BULK_CREATE}`);
    }

    if (opts.classId) {
      await this.requireOwnedClass(opts.classId, instructorId);
    }

    // A custom password only makes sense for a single account - with many,
    // every account would share the same login secret.
    if (opts.password && count !== 1) {
      throw new Error('A custom password can only be set when creating a single student');
    }
    if (opts.password) {
      const validation = validatePassword(opts.password);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const results: Array<{ username: string; password: string }> = [];

    await prisma.$transaction(async tx => {
      for (let i = 0; i < count; i++) {
        const username = await uniqueUsername();
        const password = opts.password || generatePassword();
        const passwordHash = await bcrypt.hash(password, 10);
        let encryptedPassword: string | undefined;
        if (process.env.ENCRYPTION_KEY) {
          encryptedPassword = encrypt(password);
        }

        const student = await tx.user.create({
          data: { username, passwordHash, encryptedPassword, role: 'student' },
        });
        await tx.enrollment.create({
          data: { instructorId, studentId: student.id, classId: opts.classId ?? null },
        });

        results.push({ username, password });
      }
    });

    return results;
  }

  private async requireOwnedClass(classId: string, instructorId: string) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      throw new Error('Class not found');
    }
    if (cls.instructorId !== instructorId) {
      throw new Error('Unauthorized');
    }
    return cls;
  }

  // Verifies every id belongs to this instructor in one batched query and
  // returns the matching enrollment rows. Rejects the whole batch on any
  // mismatch rather than silently skipping the offending ids.
  private async requireOwnedEnrollments(studentIds: string[], instructorId: string) {
    if (studentIds.length === 0) {
      throw new Error('No students specified');
    }
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: { in: studentIds } },
    });
    const found = new Set(enrollments.map(e => e.studentId));
    const notOwned = studentIds.filter(id => !found.has(id) || enrollments.find(e => e.studentId === id)!.instructorId !== instructorId);
    if (notOwned.length > 0) {
      throw new Error('One or more students are not enrolled under you');
    }
    return enrollments;
  }

  // Covers both "move to a class" and "bulk unenroll" (classId: null).
  async bulkAssignClass(instructorId: string, studentIds: string[], classId: string | null) {
    await this.requireOwnedEnrollments(studentIds, instructorId);
    if (classId) {
      await this.requireOwnedClass(classId, instructorId);
    }
    await prisma.enrollment.updateMany({
      where: { studentId: { in: studentIds } },
      data: { classId },
    });
  }

  async bulkArchiveStudents(instructorId: string, studentIds: string[]) {
    await this.requireOwnedEnrollments(studentIds, instructorId);
    await prisma.$transaction(async tx => {
      await tx.user.updateMany({ where: { id: { in: studentIds } }, data: { isActive: false } });
      await tx.enrollment.updateMany({ where: { studentId: { in: studentIds } }, data: { classId: null } });
    });
  }

  // Unarchived students always land Unassigned - never auto-restored to
  // whatever class they were in before, even if that class still exists.
  async bulkUnarchiveStudents(instructorId: string, studentIds: string[]) {
    await this.requireOwnedEnrollments(studentIds, instructorId);
    await prisma.user.updateMany({ where: { id: { in: studentIds } }, data: { isActive: true } });
  }

  async bulkDeleteStudents(instructorId: string, studentIds: string[]) {
    await this.requireOwnedEnrollments(studentIds, instructorId);
    // Cascades (Session, AssignmentStudent, Enrollment) handle the rest.
    const result = await prisma.user.deleteMany({ where: { id: { in: studentIds } } });
    return result.count;
  }

  async getRoster(instructorId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { instructorId },
      include: {
        student: { select: { id: true, username: true, isActive: true, createdAt: true } },
        class: true,
      },
      orderBy: { student: { username: 'asc' } },
    });

    // Only active classes - an archived class's members are always already
    // in the archived bucket above, so there's nothing left to show here.
    const classes = await prisma.class.findMany({
      where: { instructorId, isArchived: false },
      orderBy: { name: 'asc' },
    });

    const activeByClass = new Map<string, any[]>();
    const unassigned: any[] = [];
    const archived: any[] = [];

    for (const e of enrollments) {
      const row = {
        id: e.student.id,
        username: e.student.username,
        isActive: e.student.isActive,
        createdAt: e.student.createdAt,
        enrolledAt: e.createdAt,
        classId: e.classId,
        className: e.class?.name,
      };

      if (!e.student.isActive) {
        archived.push(row);
        continue;
      }
      if (!e.classId) {
        unassigned.push(row);
        continue;
      }
      if (!activeByClass.has(e.classId)) activeByClass.set(e.classId, []);
      activeByClass.get(e.classId)!.push(row);
    }

    return {
      classes: classes.map(c => ({
        class: { id: c.id, name: c.name, isArchived: c.isArchived },
        students: activeByClass.get(c.id) || [],
      })),
      unassigned,
      archived,
    };
  }
}

export const studentService = new StudentService();

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth.middleware';
import { encrypt, decrypt } from '../utils/encryption.util';
import { validatePassword, validateUsername } from '../utils/validation.util';

const prisma = new PrismaClient();

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

export class InstructorController {
  async getStudentSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { studentId, configId, dateFrom } = req.query;

      // Get enrolled student IDs for this instructor
      const enrollments = await prisma.enrollment.findMany({
        where: { instructorId },
        select: { studentId: true },
      });
      const enrolledStudentIds = enrollments.map(e => e.studentId);

      const where: any = {
        studentId: { in: enrolledStudentIds },
      };

      if (studentId) {
        // Only allow filtering to an enrolled student
        if (!enrolledStudentIds.includes(studentId as string)) {
          res.json({ sessions: [] });
          return;
        }
        where.studentId = studentId as string;
      }

      if (configId) {
        where.configurationId = configId as string;
      }

      if (dateFrom) {
        where.createdAt = {
          gte: new Date(dateFrom as string),
        };
      }

      const sessions = await prisma.session.findMany({
        where,
        include: {
          student: true,
          configuration: true,
          assignment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const mapped = sessions.map(session => ({
        id: session.id,
        studentId: session.studentId,
        studentUsername: session.student.username,
        configurationId: session.configurationId,
        configurationName: session.configuration.name,
        assignmentId: session.assignmentId,
        messages: JSON.parse(session.messages as string),
        startTime: session.startTime,
        endTime: session.endTime,
        timeRemaining: session.timeRemaining,
        isActive: session.isActive,
        outcome: session.outcome ? JSON.parse(session.outcome as string) : undefined,
        createdAt: session.createdAt,
      }));

      res.json({ sessions: mapped });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSessionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { id } = req.params;

      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          student: true,
          configuration: true,
          assignment: true,
        },
      });

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Verify the session's student is enrolled under this instructor
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId: session.studentId },
      });
      if (!enrollment || enrollment.instructorId !== instructorId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const mapped = {
        id: session.id,
        studentId: session.studentId,
        studentUsername: session.student.username,
        configurationId: session.configurationId,
        configuration: {
          id: session.configuration.id,
          name: session.configuration.name,
          scenario: session.configuration.scenario,
          studentGoals: JSON.parse(session.configuration.studentGoals as string),
          botGoals: JSON.parse(session.configuration.botGoals as string),
          studentConstraints: JSON.parse(session.configuration.studentConstraints as string),
          botConstraints: JSON.parse(session.configuration.botConstraints as string),
          botStrategy: session.configuration.botStrategy,
          temperament: session.configuration.temperament,
          difficulty: session.configuration.difficulty,
          timeLimit: session.configuration.timeLimit,
          
          personality: JSON.parse(session.configuration.personality as string),
        },
        assignmentId: session.assignmentId,
        assignment: session.assignment
          ? {
              id: session.assignment.id,
              name: session.assignment.name,
              assignmentType: session.assignment.assignmentType,
              theme: session.assignment.theme,
              deadline: session.assignment.deadline,
            }
          : undefined,
        messages: JSON.parse(session.messages as string),
        startTime: session.startTime,
        endTime: session.endTime,
        timeRemaining: session.timeRemaining,
        isActive: session.isActive,
        outcome: session.outcome ? JSON.parse(session.outcome as string) : undefined,
        createdAt: session.createdAt,
      };

      res.json({ session: mapped });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;

      const enrollments = await prisma.enrollment.findMany({
        where: { instructorId },
        include: {
          student: {
            select: {
              id: true,
              username: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          student: { username: 'asc' },
        },
      });

      const students = enrollments.map(e => ({
        ...e.student,
        enrolledAt: e.createdAt,
      }));

      res.json({ students });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async unenrollStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { studentId } = req.params;

      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId },
      });

      if (!enrollment) {
        res.status(404).json({ error: 'Enrollment not found' });
        return;
      }

      if (enrollment.instructorId !== instructorId) {
        res.status(403).json({ error: 'Not authorized to unenroll this student' });
        return;
      }

      await prisma.enrollment.delete({
        where: { studentId },
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;

      // The username is always generated here, never taken from the request -
      // students are anonymous by design, so there's no way for a real name
      // or other identifying text to end up as a login username.
      let username = generateAnonymousUsername();
      for (let attempt = 0; attempt < 5; attempt++) {
        const collision = await prisma.user.findUnique({ where: { username } });
        if (!collision) break;
        username = generateAnonymousUsername();
      }

      let password = generatePassword();
      if (typeof req.body.password === 'string' && req.body.password.trim()) {
        const validation = validatePassword(req.body.password.trim());
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
        password = req.body.password.trim();
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Encrypt password for recovery
      let encryptedPassword: string | undefined;
      if (process.env.ENCRYPTION_KEY) {
        encryptedPassword = encrypt(password);
      }

      // Create student and enroll in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const student = await tx.user.create({
          data: {
            username,
            passwordHash,
            encryptedPassword,
            role: 'student',
          },
        });

        const enrollment = await tx.enrollment.create({
          data: {
            instructorId,
            studentId: student.id,
          },
        });

        return { student, enrollment };
      });

      res.json({
        student: {
          id: result.student.id,
          username: result.student.username,
          createdAt: result.student.createdAt,
          enrolledAt: result.enrollment.createdAt,
        },
        // Only returned here, once - if ENCRYPTION_KEY isn't set on the
        // server, this is the only time the plaintext password is ever
        // available, so the frontend must show it to the instructor now.
        password,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStudentPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { studentId } = req.params;

      // Verify student is enrolled under this instructor
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId },
      });

      if (!enrollment || enrollment.instructorId !== instructorId) {
        res.status(403).json({ error: 'Student is not enrolled under you' });
        return;
      }

      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { encryptedPassword: true, username: true },
      });

      if (!student || !student.encryptedPassword) {
        res.status(400).json({ error: 'No recoverable password for this student' });
        return;
      }

      const password = decrypt(student.encryptedPassword);
      res.json({ password });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async exportStudentCredentials(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;

      const enrollments = await prisma.enrollment.findMany({
        where: { instructorId },
        include: {
          student: {
            select: { username: true, encryptedPassword: true },
          },
        },
        orderBy: { student: { username: 'asc' } },
      });

      const rows = enrollments.map((e) => {
        let password = '';
        if (e.student.encryptedPassword) {
          try {
            password = decrypt(e.student.encryptedPassword);
          } catch {
            password = '(unable to decrypt)';
          }
        } else {
          password = '(no recoverable password)';
        }
        return { username: e.student.username, password };
      });

      const csv = 'username,password\n' + rows.map((r) => `${r.username},${r.password}`).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="student_credentials.csv"');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- Admin: manage other instructor accounts. Every method here is also
  // gated by requireAdmin at the route level; the extra checks below (no
  // self-deactivation, can't strand the app with zero active admins) guard
  // against an admin locking themselves or everyone else out.

  async listInstructors(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructors = await prisma.user.findMany({
        where: { role: 'instructor' },
        select: { id: true, username: true, isAdmin: true, isActive: true, createdAt: true },
        orderBy: { username: 'asc' },
      });
      res.json({ instructors });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createInstructor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, makeAdmin } = req.body;

      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        res.status(400).json({ error: usernameValidation.error });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }

      let password = generatePassword();
      if (typeof req.body.password === 'string' && req.body.password.trim()) {
        const validation = validatePassword(req.body.password.trim());
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
        password = req.body.password.trim();
      }

      const passwordHash = await bcrypt.hash(password, 10);
      let encryptedPassword: string | undefined;
      if (process.env.ENCRYPTION_KEY) {
        encryptedPassword = encrypt(password);
      }

      const instructor = await prisma.user.create({
        data: {
          username,
          passwordHash,
          encryptedPassword,
          role: 'instructor',
          isAdmin: !!makeAdmin,
        },
      });

      res.json({
        instructor: {
          id: instructor.id,
          username: instructor.username,
          isAdmin: instructor.isAdmin,
          isActive: instructor.isActive,
          createdAt: instructor.createdAt,
        },
        // Only returned here, once - see the equivalent note on createStudent.
        password,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInstructorPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const instructor = await prisma.user.findUnique({
        where: { id },
        select: { role: true, encryptedPassword: true },
      });

      if (!instructor || instructor.role !== 'instructor') {
        res.status(404).json({ error: 'Instructor not found' });
        return;
      }

      if (!instructor.encryptedPassword) {
        res.status(400).json({ error: 'No recoverable password for this account' });
        return;
      }

      const password = decrypt(instructor.encryptedPassword);
      res.json({ password });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deactivateInstructor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const { id } = req.params;

      if (id === adminId) {
        res.status(400).json({ error: "You can't deactivate your own account." });
        return;
      }

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role !== 'instructor') {
        res.status(404).json({ error: 'Instructor not found' });
        return;
      }

      if (!target.isActive) {
        res.json({ success: true });
        return;
      }

      if (target.isAdmin) {
        const otherActiveAdmins = await prisma.user.count({
          where: { role: 'instructor', isAdmin: true, isActive: true, id: { not: id } },
        });
        if (otherActiveAdmins === 0) {
          res.status(400).json({ error: "Can't deactivate the only remaining admin." });
          return;
        }
      }

      await prisma.user.update({ where: { id }, data: { isActive: false } });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async reactivateInstructor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role !== 'instructor') {
        res.status(404).json({ error: 'Instructor not found' });
        return;
      }

      await prisma.user.update({ where: { id }, data: { isActive: true } });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

}

export const instructorController = new InstructorController();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ClassService {
  async createClass(instructorId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Class name is required');
    }
    return prisma.class.create({
      data: { instructorId, name: trimmed },
    });
  }

  async listClasses(instructorId: string) {
    const classes = await prisma.class.findMany({
      where: { instructorId },
      include: {
        _count: {
          select: { enrollments: { where: { student: { isActive: true } } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return classes.map(c => ({
      id: c.id,
      instructorId: c.instructorId,
      name: c.name,
      isArchived: c.isArchived,
      studentCount: c._count.enrollments,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
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

  async renameClass(classId: string, instructorId: string, name: string) {
    await this.requireOwnedClass(classId, instructorId);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Class name is required');
    }
    return prisma.class.update({ where: { id: classId }, data: { name: trimmed } });
  }

  // Archiving a class archives every currently-enrolled (active) member the
  // same way a single-student archive would: isActive:false + classId:null
  // together, in one transaction.
  async archiveClass(classId: string, instructorId: string) {
    await this.requireOwnedClass(classId, instructorId);

    await prisma.$transaction(async tx => {
      const members = await tx.enrollment.findMany({
        where: { classId, student: { isActive: true } },
        select: { studentId: true },
      });
      const memberIds = members.map(m => m.studentId);

      if (memberIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: memberIds } },
          data: { isActive: false },
        });
        await tx.enrollment.updateMany({
          where: { studentId: { in: memberIds } },
          data: { classId: null },
        });
      }

      await tx.class.update({ where: { id: classId }, data: { isArchived: true } });
    });
  }

  // Unarchiving a class only flips its own flag - members that were archived
  // along with it do NOT come back; they must be manually reassigned, same
  // as unarchiving a single student.
  async unarchiveClass(classId: string, instructorId: string) {
    await this.requireOwnedClass(classId, instructorId);
    await prisma.class.update({ where: { id: classId }, data: { isArchived: false } });
  }

  // Permanent. Deletes every student CURRENTLY enrolled in this class
  // (previously-archived-out members are untouched, since their enrollment
  // already has classId:null). Cascades (Session, AssignmentStudent,
  // Enrollment) handle the rest of each student's data.
  async deleteClass(classId: string, instructorId: string) {
    await this.requireOwnedClass(classId, instructorId);

    await prisma.$transaction(async tx => {
      const members = await tx.enrollment.findMany({
        where: { classId },
        select: { studentId: true },
      });
      if (members.length > 0) {
        await tx.user.deleteMany({ where: { id: { in: members.map(m => m.studentId) } } });
      }
      await tx.class.delete({ where: { id: classId } });
    });
  }
}

export const classService = new ClassService();

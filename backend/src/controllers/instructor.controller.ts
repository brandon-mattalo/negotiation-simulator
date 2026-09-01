import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth.middleware';
import { encrypt, decrypt } from '../utils/encryption.util';
import { validatePassword, validateUsername } from '../utils/validation.util';
import { classService } from '../services/class.service';
import { studentService } from '../services/student.service';

const prisma = new PrismaClient();

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

  // Flat, active-only list - used by pickers (e.g. the assignment student
  // selector) that just need "who can I assign this to," not class/archive
  // grouping. Assigning work to an archived student doesn't make sense, so
  // archived students are excluded here (the richer getRoster below is what
  // the Students management page uses instead).
  async getStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;

      const enrollments = await prisma.enrollment.findMany({
        where: { instructorId, student: { isActive: true } },
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

  async getRoster(req: AuthRequest, res: Response): Promise<void> {
    try {
      const roster = await studentService.getRoster(req.user!.userId);
      res.json(roster);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async bulkCreateStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { count, classId, password } = req.body;

      const students = await studentService.bulkCreateStudents(instructorId, Number(count) || 0, {
        classId: classId || null,
        password: typeof password === 'string' && password.trim() ? password.trim() : undefined,
      });

      res.json({ students });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkAssignClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { studentIds, classId } = req.body;
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ error: 'studentIds is required' });
        return;
      }
      await studentService.bulkAssignClass(instructorId, studentIds, classId || null);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkArchiveStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { studentIds } = req.body;
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ error: 'studentIds is required' });
        return;
      }
      await studentService.bulkArchiveStudents(instructorId, studentIds);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkUnarchiveStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { studentIds } = req.body;
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ error: 'studentIds is required' });
        return;
      }
      await studentService.bulkUnarchiveStudents(instructorId, studentIds);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkDeleteStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { studentIds } = req.body;
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ error: 'studentIds is required' });
        return;
      }
      const deletedCount = await studentService.bulkDeleteStudents(instructorId, studentIds);
      res.json({ success: true, deletedCount });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // --- Classes

  async listClasses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const classes = await classService.listClasses(req.user!.userId);
      res.json({ classes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Class name is required' });
        return;
      }
      const cls = await classService.createClass(req.user!.userId, name);
      res.json({ class: cls });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async renameClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Class name is required' });
        return;
      }
      const cls = await classService.renameClass(id, req.user!.userId, name);
      res.json({ class: cls });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async archiveClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await classService.archiveClass(id, req.user!.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async unarchiveClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await classService.unarchiveClass(id, req.user!.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await classService.deleteClass(id, req.user!.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
      const { classId } = req.query;

      const enrollments = await prisma.enrollment.findMany({
        where: { instructorId, ...(classId ? { classId: classId as string } : {}) },
        include: {
          student: {
            select: { username: true, encryptedPassword: true },
          },
          class: { select: { name: true } },
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
        return { username: e.student.username, password, className: e.class?.name || 'Unassigned' };
      });

      const csv = 'username,password,class\n' + rows.map((r) => `${r.username},${r.password},${r.className}`).join('\n');

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

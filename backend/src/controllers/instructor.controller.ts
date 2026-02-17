import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

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

  async enrollStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const { username } = req.body;

      if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
      }

      const student = await prisma.user.findUnique({
        where: { username },
      });

      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      if (student.role !== 'student') {
        res.status(400).json({ error: 'User is not a student' });
        return;
      }

      const existingEnrollment = await prisma.enrollment.findUnique({
        where: { studentId: student.id },
      });

      if (existingEnrollment) {
        res.status(400).json({ error: 'Student is already enrolled with an instructor' });
        return;
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          instructorId,
          studentId: student.id,
        },
        include: {
          student: {
            select: {
              id: true,
              username: true,
              createdAt: true,
            },
          },
        },
      });

      res.json({
        student: {
          ...enrollment.student,
          enrolledAt: enrollment.createdAt,
        },
      });
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

  async getUnenrolledStudents(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const students = await prisma.user.findMany({
        where: {
          role: 'student',
          enrollment: null,
        },
        select: {
          id: true,
          username: true,
          createdAt: true,
        },
        orderBy: { username: 'asc' },
      });

      res.json({ students });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const instructorController = new InstructorController();

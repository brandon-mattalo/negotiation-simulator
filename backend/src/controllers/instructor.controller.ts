import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class InstructorController {
  async getStudentSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { studentId, configId, dateFrom } = req.query;

      const where: any = {};

      if (studentId) {
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
      const students = await prisma.user.findMany({
        where: { role: 'student' },
        select: {
          id: true,
          username: true,
          createdAt: true,
        },
        orderBy: {
          username: 'asc',
        },
      });

      res.json({ students });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const instructorController = new InstructorController();

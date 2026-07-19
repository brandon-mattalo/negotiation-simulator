import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateTemperament, validateTimeLimit } from '../utils/validation.util';

const prisma = new PrismaClient();

export class ConfigController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      // Instructors see their own configs, students see their professor's active configs
      let where: any;
      if (role === 'instructor') {
        where = { instructorId: userId };
      } else {
        // Look up the student's enrollment to find their professor
        const enrollment = await prisma.enrollment.findUnique({
          where: { studentId: userId },
        });
        if (!enrollment) {
          res.json({ configurations: [] });
          return;
        }
        where = { isActive: true, instructorId: enrollment.instructorId };
      }

      const configs = await prisma.configuration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      const mapped = configs.map(config => ({
        id: config.id,
        instructorId: config.instructorId,
        name: config.name,
        scenario: config.scenario,
        studentGoals: JSON.parse(config.studentGoals as string),
        botGoals: JSON.parse(config.botGoals as string),
        studentConstraints: JSON.parse(config.studentConstraints as string),
        botConstraints: JSON.parse(config.botConstraints as string),
        botOpeningOffer: typeof config.botOpeningOffer === 'string' ? JSON.parse(config.botOpeningOffer) : (config.botOpeningOffer || []),
        rubric: typeof config.rubric === 'string' ? JSON.parse(config.rubric) : (config.rubric || []),
        botStrategy: config.botStrategy,
        temperament: config.temperament,
        difficulty: config.difficulty,
        timeLimit: config.timeLimit,
        personality: JSON.parse(config.personality as string),
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }));

      res.json({ configurations: mapped });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const config = await prisma.configuration.findUnique({
        where: { id },
      });

      if (!config) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }

      const mapped = {
        id: config.id,
        instructorId: config.instructorId,
        name: config.name,
        scenario: config.scenario,
        studentGoals: JSON.parse(config.studentGoals as string),
        botGoals: JSON.parse(config.botGoals as string),
        studentConstraints: JSON.parse(config.studentConstraints as string),
        botConstraints: JSON.parse(config.botConstraints as string),
        botOpeningOffer: typeof config.botOpeningOffer === 'string' ? JSON.parse(config.botOpeningOffer) : (config.botOpeningOffer || []),
        rubric: typeof config.rubric === 'string' ? JSON.parse(config.rubric) : (config.rubric || []),
        botStrategy: config.botStrategy,
        temperament: config.temperament,
        difficulty: config.difficulty,
        timeLimit: config.timeLimit,
        personality: JSON.parse(config.personality as string),
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

      res.json({ configuration: mapped });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const {
        name,
        scenario,
        studentGoals, botGoals, studentConstraints, botConstraints,
        botOpeningOffer,
        rubric,
        botStrategy,
        temperament,
        difficulty,
        timeLimit,
        personality,
      } = req.body;

      // Validate temperament
      const tempValidation = validateTemperament(temperament);
      if (!tempValidation.valid) {
        res.status(400).json({ error: tempValidation.error });
        return;
      }

      // Validate time limit
      const timeValidation = validateTimeLimit(timeLimit);
      if (!timeValidation.valid) {
        res.status(400).json({ error: timeValidation.error });
        return;
      }

      const config = await prisma.configuration.create({
        data: {
          instructorId: userId,
          name,
          scenario,
          studentGoals: JSON.stringify(studentGoals),
          botGoals: JSON.stringify(botGoals),
          studentConstraints: JSON.stringify(studentConstraints),
          botConstraints: JSON.stringify(botConstraints),
          botOpeningOffer: JSON.stringify(botOpeningOffer || []),
          rubric: JSON.stringify(rubric || []),
          botStrategy,
          temperament,
          difficulty,
          timeLimit,

          personality: JSON.stringify(personality),
        },
      });

      const mapped = {
        id: config.id,
        instructorId: config.instructorId,
        name: config.name,
        scenario: config.scenario,
        studentGoals: JSON.parse(config.studentGoals as string),
        botGoals: JSON.parse(config.botGoals as string),
        studentConstraints: JSON.parse(config.studentConstraints as string),
        botConstraints: JSON.parse(config.botConstraints as string),
        botOpeningOffer: typeof config.botOpeningOffer === 'string' ? JSON.parse(config.botOpeningOffer) : (config.botOpeningOffer || []),
        rubric: typeof config.rubric === 'string' ? JSON.parse(config.rubric) : (config.rubric || []),
        botStrategy: config.botStrategy,
        temperament: config.temperament,
        difficulty: config.difficulty,
        timeLimit: config.timeLimit,
        personality: JSON.parse(config.personality as string),
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

      res.status(201).json({ configuration: mapped });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Check if config exists and belongs to instructor
      const existing = await prisma.configuration.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }

      if (existing.instructorId !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const updates: any = {};
      const allowedFields = [
        'name',
        'scenario',
        'studentGoals',
        'botGoals',
        'studentConstraints',
        'botConstraints',
        'botOpeningOffer',
        'rubric',
        'botStrategy',
        'temperament',
        'difficulty',
        'timeLimit',
        'personality',
      ];

      for (const field of allowedFields) {
        if (field in req.body) {
          if (field === 'studentGoals' || field === 'botGoals' ||
              field === 'studentConstraints' || field === 'botConstraints' ||
              field === 'botOpeningOffer' || field === 'rubric' || field === 'personality') {
            updates[field] = JSON.stringify(req.body[field]);
          } else {
            updates[field] = req.body[field];
          }
        }
      }

      // Validate if temperament or timeLimit are being updated
      if ('temperament' in updates) {
        const validation = validateTemperament(updates.temperament);
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
      }

      if ('timeLimit' in updates) {
        const validation = validateTimeLimit(updates.timeLimit);
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
      }

      const config = await prisma.configuration.update({
        where: { id },
        data: updates,
      });

      const mapped = {
        id: config.id,
        instructorId: config.instructorId,
        name: config.name,
        scenario: config.scenario,
        studentGoals: JSON.parse(config.studentGoals as string),
        botGoals: JSON.parse(config.botGoals as string),
        studentConstraints: JSON.parse(config.studentConstraints as string),
        botConstraints: JSON.parse(config.botConstraints as string),
        botOpeningOffer: typeof config.botOpeningOffer === 'string' ? JSON.parse(config.botOpeningOffer) : (config.botOpeningOffer || []),
        rubric: typeof config.rubric === 'string' ? JSON.parse(config.rubric) : (config.rubric || []),
        botStrategy: config.botStrategy,
        temperament: config.temperament,
        difficulty: config.difficulty,
        timeLimit: config.timeLimit,
        personality: JSON.parse(config.personality as string),
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

      res.json({ configuration: mapped });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const existing = await prisma.configuration.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }

      if (existing.instructorId !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      await prisma.configuration.delete({
        where: { id },
      });

      res.json({ message: 'Configuration deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async activate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const existing = await prisma.configuration.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }

      if (existing.instructorId !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Deactivate all other configs for this instructor
      await prisma.configuration.updateMany({
        where: { instructorId: userId },
        data: { isActive: false },
      });

      // Activate this config
      const config = await prisma.configuration.update({
        where: { id },
        data: { isActive: true },
      });

      const mapped = {
        id: config.id,
        instructorId: config.instructorId,
        name: config.name,
        scenario: config.scenario,
        studentGoals: JSON.parse(config.studentGoals as string),
        botGoals: JSON.parse(config.botGoals as string),
        studentConstraints: JSON.parse(config.studentConstraints as string),
        botConstraints: JSON.parse(config.botConstraints as string),
        botOpeningOffer: typeof config.botOpeningOffer === 'string' ? JSON.parse(config.botOpeningOffer) : (config.botOpeningOffer || []),
        rubric: typeof config.rubric === 'string' ? JSON.parse(config.rubric) : (config.rubric || []),
        botStrategy: config.botStrategy,
        temperament: config.temperament,
        difficulty: config.difficulty,
        timeLimit: config.timeLimit,
        personality: JSON.parse(config.personality as string),
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

      res.json({ configuration: mapped });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const configController = new ConfigController();

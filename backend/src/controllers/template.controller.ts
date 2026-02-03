import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class TemplateController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const templates = await prisma.template.findMany({
        where: { isDefault: true },
        orderBy: { createdAt: 'asc' },
      });

      const mapped = templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        configuration: JSON.parse(template.configuration as string),
        isDefault: template.isDefault,
      }));

      res.json({ templates: mapped });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await prisma.template.findUnique({
        where: { id },
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      const mapped = {
        id: template.id,
        name: template.name,
        description: template.description,
        configuration: JSON.parse(template.configuration as string),
        isDefault: template.isDefault,
      };

      res.json({ template: mapped });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async useTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const instructorId = req.user!.userId;

      const template = await prisma.template.findUnique({
        where: { id },
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      const templateConfig = JSON.parse(template.configuration as string);

      // Create a new configuration based on the template
      const config = await prisma.configuration.create({
        data: {
          instructorId,
          name: templateConfig.name,
          scenario: templateConfig.scenario,
          studentGoals: JSON.stringify(templateConfig.studentGoals),
          botGoals: JSON.stringify(templateConfig.botGoals),
          studentConstraints: JSON.stringify(templateConfig.studentConstraints),
          botConstraints: JSON.stringify(templateConfig.botConstraints),
          botOpeningOffer: JSON.stringify(templateConfig.botOpeningOffer || []),
          botStrategy: templateConfig.botStrategy,
          temperament: templateConfig.temperament,
          difficulty: templateConfig.difficulty,
          timeLimit: templateConfig.timeLimit,
          personality: JSON.stringify(templateConfig.personality),
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
}

export const templateController = new TemplateController();

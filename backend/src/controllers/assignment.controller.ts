import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { assignmentService } from '../services/assignment.service';
import { AssignmentType } from '../shared/types/negotiation';

export class AssignmentController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      let assignments;
      if (role === 'student') {
        assignments = await assignmentService.getAssignmentsForStudent(userId);
      } else {
        assignments = await assignmentService.getAssignmentsForInstructor(userId);
      }

      res.json({ assignments });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const assignment = await assignmentService.getAssignment(id);

      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      res.json({ assignment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const {
        configurationId,
        studentId,
        name,
        description,
        assignmentType,
        theme,
        availableFrom,
        availableUntil,
        deadline,
      } = req.body;

      const assignment = await assignmentService.createAssignment({
        instructorId,
        configurationId,
        studentId,
        name,
        description,
        assignmentType: assignmentType as AssignmentType,
        theme,
        availableFrom: new Date(availableFrom),
        availableUntil: new Date(availableUntil),
        deadline: new Date(deadline),
      });

      res.status(201).json({ assignment });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createBulk(req: AuthRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.userId;
      const {
        configurationId,
        studentIds,
        name,
        description,
        assignmentType,
        theme,
        availableFrom,
        availableUntil,
        deadline,
      } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ error: 'studentIds must be a non-empty array' });
        return;
      }

      const assignments = await assignmentService.createBulkAssignments(
        instructorId,
        configurationId,
        studentIds,
        {
          name,
          description,
          assignmentType: assignmentType as AssignmentType,
          theme,
          availableFrom: new Date(availableFrom),
          availableUntil: new Date(availableUntil),
          deadline: new Date(deadline),
        }
      );

      res.status(201).json({ assignments });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const instructorId = req.user!.userId;

      const updates: any = {};
      const allowedFields = [
        'name',
        'description',
        'theme',
        'availableFrom',
        'availableUntil',
        'deadline',
        'isActive',
      ];

      for (const field of allowedFields) {
        if (field in req.body) {
          if (['availableFrom', 'availableUntil', 'deadline'].includes(field)) {
            updates[field] = new Date(req.body[field]);
          } else {
            updates[field] = req.body[field];
          }
        }
      }

      const assignment = await assignmentService.updateAssignment(id, instructorId, updates);
      res.json({ assignment });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const instructorId = req.user!.userId;

      await assignmentService.deleteAssignment(id, instructorId);
      res.json({ message: 'Assignment deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const assignments = await assignmentService.getAssignmentsForStudent(studentId);
      res.json({ assignments });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const assignmentController = new AssignmentController();

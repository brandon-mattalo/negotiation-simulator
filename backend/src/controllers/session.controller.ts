import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sessionService } from '../services/session.service';
import { isReviewerStudentUsername, reviewerLimitsService } from '../services/reviewerLimits.service';

export class SessionController {
  async start(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;
      const { configurationId, assignmentId } = req.body;

      if (isReviewerStudentUsername(req.user!.username)) {
        await reviewerLimitsService.reapIdleSessionIfAny(studentId);
        const limit = await reviewerLimitsService.checkSessionStartLimit(studentId);
        if (!limit.allowed) {
          res.status(429).json({ error: limit.reason });
          return;
        }
      }

      const session = await sessionService.startSession(studentId, configurationId, assignmentId);
      res.status(201).json({ session });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role as 'instructor' | 'student';

      const sessions = await sessionService.getSessionHistory(userId, role);
      res.json({ sessions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const owner = await sessionService.getSessionOwnerInfo(id);

      if (!owner) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const userId = req.user!.userId;
      const role = req.user!.role;
      const authorized = role === 'instructor' ? owner.instructorId === userId : owner.studentId === userId;
      if (!authorized) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const session = await sessionService.getSession(id);
      res.json({ session });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;
      const { message, interruptedBot } = req.body;

      if (isReviewerStudentUsername(req.user!.username)) {
        const session = await sessionService.getSession(id);
        if (session && session.studentId === studentId) {
          const limit = reviewerLimitsService.checkMessageLimit(session.messages);
          if (!limit.allowed) {
            res.status(429).json({ error: limit.reason });
            return;
          }
        }
      }

      const result = await sessionService.sendMessage(id, message, studentId, interruptedBot);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async end(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;

      const outcome = await sessionService.endSession(id, studentId);
      res.json({ outcome });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getActive(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;
      const session = await sessionService.getActiveSession(studentId);

      if (!session) {
        res.status(404).json({ error: 'No active session found' });
        return;
      }

      res.json({ session });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const instructorId = req.user!.userId;

      const owner = await sessionService.getSessionOwnerInfo(id);
      if (!owner) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (owner.instructorId !== instructorId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      await sessionService.deleteSession(id);
      res.json({ message: 'Session deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;

      await sessionService.cancelSession(id, studentId);
      res.json({ message: 'Session cancelled successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const sessionController = new SessionController();

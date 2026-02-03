import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sessionService } from '../services/session.service';

export class SessionController {
  async start(req: AuthRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;
      const { configurationId, assignmentId } = req.body;

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
      const session = await sessionService.getSession(id);

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

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

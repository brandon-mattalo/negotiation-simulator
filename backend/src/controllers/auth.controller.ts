import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, role } = req.body;

      if (!['instructor', 'student'].includes(role)) {
        res.status(400).json({ error: 'Invalid role. Must be "instructor" or "student"' });
        return;
      }

      const user = await authService.register(username, password, role);
      res.status(201).json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const { token, user } = await authService.login(username, password);

      res.json({ token, user });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // With JWT, logout is typically handled client-side by removing the token
    res.json({ message: 'Logged out successfully' });
  }
}

export const authController = new AuthController();

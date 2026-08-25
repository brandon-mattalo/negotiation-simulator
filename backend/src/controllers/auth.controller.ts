import { Request, Response } from 'express';
import { authService, InvalidCredentialsError, AccountDeactivatedError } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { reviewerResetService } from '../services/reviewerReset.service';

// A rejected login (bad username/password) is a 401; a deactivated account
// is a 403 (the credentials are correct, access just isn't allowed); anything
// else thrown by authService.login (DB unreachable, JWT misconfigured, etc.)
// is a genuine server-side failure and should surface as a 500, not look
// like bad creds.
function respondToLoginFailure(res: Response, error: any): void {
  if (error instanceof InvalidCredentialsError) {
    res.status(401).json({ error: error.message });
    return;
  }
  if (error instanceof AccountDeactivatedError) {
    res.status(403).json({ error: error.message });
    return;
  }
  console.error('Unexpected login error:', error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const { token, user } = await authService.login(username, password);

      res.json({ token, user });
    } catch (error: any) {
      respondToLoginFailure(res, error);
    }
  }

  async reviewerLogin(req: Request, res: Response): Promise<void> {
    try {
      if (process.env.REVIEWER_ACCOUNTS_ENABLED === 'false') {
        res.status(503).json({ error: 'Reviewer accounts are temporarily disabled.' });
        return;
      }

      const { role } = req.body;

      // Credentials live only in the server environment (Railway) so they are
      // never shipped to the browser. Usernames are not secret and fall back to
      // the seeded defaults; passwords must be provided via env.
      const accounts: Record<string, { username: string; password?: string }> = {
        professor: {
          username: process.env.REVIEWER_PROF_USERNAME || 'reviewer-prof',
          password: process.env.REVIEWER_PROF_PASSWORD,
        },
        student: {
          username: process.env.REVIEWER_STUDENT_USERNAME || 'reviewer-student',
          password: process.env.REVIEWER_STUDENT_PASSWORD,
        },
      };

      const account = accounts[role];
      if (!account) {
        res.status(400).json({ error: 'Invalid reviewer role. Must be "professor" or "student"' });
        return;
      }

      if (!account.password) {
        res.status(503).json({ error: 'Reviewer accounts are not configured on the server' });
        return;
      }

      await reviewerResetService.maybeReset();

      const { token, user } = await authService.login(account.username, account.password);
      res.json({ token, user });
    } catch (error: any) {
      respondToLoginFailure(res, error);
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

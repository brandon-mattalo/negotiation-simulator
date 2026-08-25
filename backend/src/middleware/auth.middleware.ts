import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { authService } from '../services/auth.service';
import { reviewerResetService } from '../services/reviewerReset.service';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
    isAdmin: boolean;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = verifyToken(token);

    // Verify user still exists and hasn't been deactivated since this token
    // was issued - re-checked on every request, not just at login.
    const user = await authService.getUserById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    if (user.isActive === false) {
      res.status(403).json({ error: 'This account has been deactivated.' });
      return;
    }

    req.user = payload;
    // Fire-and-forget-safe (never throws) - lets the reviewer reset defer
    // itself while either reviewer account is doing anything at all, not
    // just mid-negotiation. A no-op for every other user.
    await reviewerResetService.touchActivity(payload.username);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

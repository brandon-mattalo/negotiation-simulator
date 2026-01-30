import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserRole } from '../../../shared/types/negotiation';

export const requireRole = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: `${role} access required` });
      return;
    }

    next();
  };
};

export const requireInstructor = requireRole('instructor');
export const requireStudent = requireRole('student');

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Role } from '../config';

export function requireRoles(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
}

// Shorthand middleware for common role checks
export const adminOnly = requireRoles('ADMIN');
export const staffOnly = requireRoles('ADMIN', 'LIBRARIAN');
export const allRoles = requireRoles('ADMIN', 'LIBRARIAN', 'MEMBER');

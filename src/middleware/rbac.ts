import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

type Role = 'VIEWER' | 'ANALYST' | 'ADMIN';

/**
 * Role-Based Access Control middleware.
 * Usage: router.get('/route', requireAuth, requireRole('ADMIN'), handler)
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(errorResponse('Not authenticated.', 401));
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res
        .status(403)
        .json(
          errorResponse(
            `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
            403
          )
        );
      return;
    }

    next();
  };
};

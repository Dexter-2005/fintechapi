import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response';
import prisma from '../config/db';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// Extend Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('No token provided. Please log in.', 401));
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET as string;

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      res.status(401).json(errorResponse('User no longer exists.', 401));
      return;
    }

    if (user.status === 'INACTIVE') {
      res.status(403).json(errorResponse('Your account has been deactivated.', 403));
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json(errorResponse('Token has expired. Please log in again.', 401));
      return;
    }
    res.status(401).json(errorResponse('Invalid token.', 401));
  }
};

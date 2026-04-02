import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';
import { successResponse, errorResponse } from '../../utils/response';
import { RegisterInput, LoginInput } from './auth.schema';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body as RegisterInput;

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json(errorResponse('Email already in use.', 409));
      return;
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    const jwtSecret = process.env.JWT_SECRET as string;
    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.status(201).json(
      successResponse({ user, token }, 'User registered successfully.', 201)
    );
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json(errorResponse('Invalid email or password.', 401));
      return;
    }

    if (user.status === 'INACTIVE') {
      res.status(403).json(errorResponse('Your account has been deactivated.', 403));
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json(errorResponse('Invalid email or password.', 401));
      return;
    }

    const jwtSecret = process.env.JWT_SECRET as string;
    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // Never return password
    const { password: _pw, ...userWithoutPassword } = user;

    res.status(200).json(
      successResponse({ user: userWithoutPassword, token }, 'Login successful.')
    );
  } catch (err) {
    next(err);
  }
};

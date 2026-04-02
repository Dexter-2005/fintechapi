import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { successResponse, errorResponse } from '../../utils/response';
import { UpdateRoleInput, UpdateStatusInput } from './users.schema';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * GET /api/users
 * List all users (Admin only)
 */
export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: 'desc' } });
    res.status(200).json(successResponse(users, 'Users fetched successfully.'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Get a single user by ID (Admin only)
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: USER_SELECT,
    });

    if (!user) {
      res.status(404).json(errorResponse('User not found.', 404));
      return;
    }

    res.status(200).json(successResponse(user, 'User fetched successfully.'));
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/role
 * Update user role (Admin only)
 */
export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.body as UpdateRoleInput;

    // Prevent admin from changing their own role
    if (req.user?.id === req.params.id) {
      res.status(400).json(errorResponse('You cannot change your own role.', 400));
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json(errorResponse('User not found.', 404));
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: USER_SELECT,
    });

    res.status(200).json(successResponse(updated, 'User role updated successfully.'));
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/status
 * Activate or deactivate a user (Admin only)
 */
export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body as UpdateStatusInput;

    // Prevent admin from deactivating themselves
    if (req.user?.id === req.params.id) {
      res.status(400).json(errorResponse('You cannot change your own status.', 400));
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json(errorResponse('User not found.', 404));
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
      select: USER_SELECT,
    });

    res.status(200).json(successResponse(updated, `User ${status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Hard delete a user (Admin only)
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.id === req.params.id) {
      res.status(400).json(errorResponse('You cannot delete your own account.', 400));
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json(errorResponse('User not found.', 404));
      return;
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(200).json(successResponse(null, 'User deleted successfully.'));
  } catch (err) {
    next(err);
  }
};

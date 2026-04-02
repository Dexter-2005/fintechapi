import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { successResponse, errorResponse } from '../../utils/response';
import { CreateRecordInput, UpdateRecordInput } from './records.schema';

/**
 * POST /api/records
 * Create a financial record (ADMIN only)
 */
export const createRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, type, category, date, notes } = req.body as CreateRecordInput;

    const record = await prisma.financialRecord.create({
      data: {
        amount,
        type,
        category,
        date: new Date(date),
        notes,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json(successResponse(record, 'Financial record created successfully.', 201));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/records
 * List records with filters & pagination (All authenticated users)
 */
export const getRecords = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isDeleted: false };

    if (type === 'INCOME' || type === 'EXPENSE') {
      where.type = type;
    }
    if (category) {
      where.category = { contains: category };
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [total, records] = await Promise.all([
      prisma.financialRecord.count({ where }),
      prisma.financialRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    res.status(200).json(
      successResponse(
        {
          records,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
        'Records fetched successfully.'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/records/:id
 * Get a single financial record (All authenticated users)
 */
export const getRecordById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const record = await prisma.financialRecord.findFirst({
      where: { id: req.params.id, isDeleted: false },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!record) {
      res.status(404).json(errorResponse('Financial record not found.', 404));
      return;
    }

    res.status(200).json(successResponse(record, 'Record fetched successfully.'));
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/records/:id
 * Update a financial record (ADMIN only)
 */
export const updateRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = req.body as UpdateRecordInput;

    const existing = await prisma.financialRecord.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!existing) {
      res.status(404).json(errorResponse('Financial record not found.', 404));
      return;
    }

    const updated = await prisma.financialRecord.update({
      where: { id: req.params.id },
      data: {
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.date !== undefined && { date: new Date(input.date) }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });

    res.status(200).json(successResponse(updated, 'Record updated successfully.'));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/records/:id
 * Soft delete a financial record (ADMIN only)
 */
export const deleteRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const existing = await prisma.financialRecord.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!existing) {
      res.status(404).json(errorResponse('Financial record not found.', 404));
      return;
    }

    await prisma.financialRecord.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    res.status(200).json(successResponse(null, 'Record deleted successfully.'));
  } catch (err) {
    next(err);
  }
};

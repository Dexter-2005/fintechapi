import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ErrorHandler]', err);

  // Prisma known request errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };

    if (prismaErr.code === 'P2002') {
      res.status(409).json(
        errorResponse(
          `A record with that ${prismaErr.meta?.target?.join(', ') ?? 'value'} already exists.`,
          409
        )
      );
      return;
    }

    if (prismaErr.code === 'P2025') {
      res.status(404).json(errorResponse('Record not found.', 404));
      return;
    }
  }

  res.status(500).json(errorResponse('Internal server error.', 500));
};

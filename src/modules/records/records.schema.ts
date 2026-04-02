import { z } from 'zod';

export const createRecordSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be a positive number'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
  }),
  category: z.string().min(1, 'Category is required').max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: 'Date must be a valid ISO 8601 date string',
  }),
  notes: z.string().max(500).optional(),
});

export const updateRecordSchema = createRecordSchema.partial();

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;

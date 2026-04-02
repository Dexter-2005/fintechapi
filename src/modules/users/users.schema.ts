import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be VIEWER, ANALYST, or ADMIN' }),
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

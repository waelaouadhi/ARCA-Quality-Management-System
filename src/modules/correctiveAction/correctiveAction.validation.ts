import { z } from 'zod';
import { CuidSchema } from '../../shared/utils/idValidation';

/**
 * CorrectiveAction validation schemas using Zod
 */

export const CreateCorrectiveActionInputSchema = z.object({
  action: z
    .string()
    .min(5, 'Action must be at least 5 characters')
    .max(1000, 'Action must not exceed 1,000 characters')
    .trim(),
  
  nonConformanceId: z
    .string()
    .pipe(CuidSchema),
  
  assignedToId: z
    .string()
    .pipe(CuidSchema)
    .optional(),
  
  dueDate: z
    .string()
    .datetime('Invalid date format, expected ISO 8601 datetime')
    .or(z.date())
    .optional(),
  
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE'], {
    errorMap: () => ({ message: 'Status must be one of: PENDING, IN_PROGRESS, DONE' }),
  }).optional(),

  // Phase 1: 2-stage workflow fields
  rootCauseAnalysis: z
    .string()
    .min(10, 'Root cause analysis must be at least 10 characters')
    .max(5000, 'Root cause analysis must not exceed 5,000 characters')
    .trim()
    .optional(),

  requestStatus: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'PLANNED'], {
    errorMap: () => ({ message: 'Request status must be one of: PENDING, ACCEPTED, REJECTED, PLANNED' }),
  }).optional(),
});

export const UpdateCorrectiveActionInputSchema = z.object({
  action: z
    .string()
    .min(5, 'Action must be at least 5 characters')
    .max(1000, 'Action must not exceed 1,000 characters')
    .trim()
    .optional(),
  
  assignedToId: z
    .string()
    .pipe(CuidSchema)
    .optional(),
  
  dueDate: z
    .string()
    .datetime('Invalid date format, expected ISO 8601 datetime')
    .or(z.date())
    .optional()
    .nullable(),
  
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE'], {
    errorMap: () => ({ message: 'Status must be one of: PENDING, IN_PROGRESS, DONE' }),
  }).optional(),

  // Phase 1: 2-stage workflow fields
  rootCauseAnalysis: z
    .string()
    .min(10, 'Root cause analysis must be at least 10 characters')
    .max(5000, 'Root cause analysis must not exceed 5,000 characters')
    .trim()
    .optional()
    .nullable(),

  requestStatus: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'PLANNED'], {
    errorMap: () => ({ message: 'Request status must be one of: PENDING, ACCEPTED, REJECTED, PLANNED' }),
  }).optional(),

  verificationNotes: z
    .string()
    .max(2000, 'Verification notes must not exceed 2,000 characters')
    .trim()
    .optional()
    .nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const CorrectiveActionIdSchema = CuidSchema.describe('Corrective Action ID');

export type CreateCorrectiveActionInput = z.infer<typeof CreateCorrectiveActionInputSchema>;
export type UpdateCorrectiveActionInput = z.infer<typeof UpdateCorrectiveActionInputSchema>;

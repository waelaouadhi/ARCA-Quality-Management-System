import { z } from 'zod';

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
    .uuid('Invalid non-conformance ID format'),
  
  assignedTo: z
    .string()
    .uuid('Invalid assignee user ID format')
    .optional(),
  
  dueDate: z
    .string()
    .datetime('Invalid date format, expected ISO 8601 datetime')
    .or(z.date())
    .optional(),
  
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE'], {
    errorMap: () => ({ message: 'Status must be one of: PENDING, IN_PROGRESS, DONE' }),
  }).optional(),
});

export const UpdateCorrectiveActionInputSchema = z.object({
  action: z
    .string()
    .min(5, 'Action must be at least 5 characters')
    .max(1000, 'Action must not exceed 1,000 characters')
    .trim()
    .optional(),
  
  assignedTo: z
    .string()
    .uuid('Invalid assignee user ID format')
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
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const CorrectiveActionIdSchema = z.string().uuid('Invalid corrective action ID format');

export type CreateCorrectiveActionInput = z.infer<typeof CreateCorrectiveActionInputSchema>;
export type UpdateCorrectiveActionInput = z.infer<typeof UpdateCorrectiveActionInputSchema>;

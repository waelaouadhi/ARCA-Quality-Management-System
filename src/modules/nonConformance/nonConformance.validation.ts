import { z } from 'zod';

/**
 * NonConformance validation schemas using Zod
 */

export const CreateNonConformanceInputSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5,000 characters')
    .trim(),
  
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL' }),
  }),
  
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'CLOSED'], {
    errorMap: () => ({ message: 'Status must be one of: OPEN, UNDER_INVESTIGATION, CLOSED' }),
  }).optional(),
  
  rootCause: z
    .string()
    .max(2000, 'Root cause must not exceed 2,000 characters')
    .optional(),
});

export const UpdateNonConformanceInputSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5,000 characters')
    .trim()
    .optional(),
  
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL' }),
  }).optional(),
  
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'CLOSED'], {
    errorMap: () => ({ message: 'Status must be one of: OPEN, UNDER_INVESTIGATION, CLOSED' }),
  }).optional(),
  
  rootCause: z
    .string()
    .max(2000, 'Root cause must not exceed 2,000 characters')
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const NonConformanceIdSchema = z.string().uuid('Invalid non-conformance ID format');

export type CreateNonConformanceInput = z.infer<typeof CreateNonConformanceInputSchema>;
export type UpdateNonConformanceInput = z.infer<typeof UpdateNonConformanceInputSchema>;

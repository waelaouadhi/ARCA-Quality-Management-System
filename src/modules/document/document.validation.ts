import { z } from 'zod';

/**
 * Document validation schemas using Zod
 */

export const CreateDocumentInputSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  
  content: z
    .string()
    .max(50000, 'Content must not exceed 50,000 characters')
    .optional(),
  
  type: z.enum(['POLICY', 'PROCEDURE', 'FORM', 'RECORD'], {
    errorMap: () => ({ message: 'Type must be one of: POLICY, PROCEDURE, FORM, RECORD' }),
  }).optional(),
  
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'], {
    errorMap: () => ({ message: 'Status must be one of: DRAFT, ACTIVE, ARCHIVED' }),
  }).optional(),
});

export const UpdateDocumentInputSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  
  content: z
    .string()
    .max(50000, 'Content must not exceed 50,000 characters')
    .optional(),
  
  type: z.enum(['POLICY', 'PROCEDURE', 'FORM', 'RECORD'], {
    errorMap: () => ({ message: 'Type must be one of: POLICY, PROCEDURE, FORM, RECORD' }),
  }).optional(),
  
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'], {
    errorMap: () => ({ message: 'Status must be one of: DRAFT, ACTIVE, ARCHIVED' }),
  }).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const DocumentIdSchema = z.string().uuid('Invalid document ID format');

export type CreateDocumentInput = z.infer<typeof CreateDocumentInputSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentInputSchema>;

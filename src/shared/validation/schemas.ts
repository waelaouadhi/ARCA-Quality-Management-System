import { z } from 'zod';

// ===========================
// AUTH SCHEMAS
// ===========================

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ===========================
// USER SCHEMAS
// ===========================

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().max(254).optional(),
});

// ===========================
// DOCUMENT SCHEMAS
// ===========================

export const CreateDocumentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  content: z.string().max(50000).optional(),
});

export const UpdateDocumentSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  content: z.string().max(50000).optional(),
  version: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED']).optional(),
});

// ===========================
// NON-CONFORMANCE SCHEMAS
// ===========================

export const CreateNonConformanceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000).trim(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const UpdateNonConformanceSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().min(10).max(5000).trim().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
});

// ===========================
// CORRECTIVE ACTION SCHEMAS
// ===========================

export const CreateCorrectiveActionSchema = z.object({
  action: z.string().min(10, 'Action description must be at least 10 characters').max(2000).trim(),
  nonConformanceId: z.string().min(1, 'Non-conformance ID is required'),
  assignedToId: z.string().optional(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .optional(),
});

export const UpdateCorrectiveActionSchema = z.object({
  action: z.string().min(10).max(2000).trim().optional(),
  assignedToId: z.string().optional(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']).optional(),
});

// ===========================
// HELPERS
// ===========================

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type CreateNonConformanceInput = z.infer<typeof CreateNonConformanceSchema>;
export type UpdateNonConformanceInput = z.infer<typeof UpdateNonConformanceSchema>;
export type CreateCorrectiveActionInput = z.infer<typeof CreateCorrectiveActionSchema>;
export type UpdateCorrectiveActionInput = z.infer<typeof UpdateCorrectiveActionSchema>;

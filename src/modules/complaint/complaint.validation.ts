import { z } from 'zod';

export const complaintIdSchema = z.string().regex(/^[a-z0-9]{25}$/, 'Invalid complaint ID');

export const createComplaintSchema = z.object({
  title: z.string().min(5, 'Title required'),
  description: z.string().min(10, 'Description required'),
  category: z.string().min(2, 'Category required'),
  source: z.string().min(2, 'Source required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  reportedDate: z.string().datetime(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  reportedBy: z.string().optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export const updateComplaintSchema = z.object({
  id: complaintIdSchema,
  title: z.string().optional(),
  status: z.enum(['OPEN', 'IN_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
  findings: z.string().optional(),
  rootCause: z.string().optional(),
});

export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;

export const createInvestigationSchema = z.object({
  complaintId: complaintIdSchema,
  methodology: z.string().optional(),
  immediateActions: z.string().optional(),
});

export type CreateInvestigationInput = z.infer<typeof createInvestigationSchema>;

export const addAttachmentSchema = z.object({
  complaintId: complaintIdSchema,
  filename: z.string().min(1),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().positive(),
  description: z.string().optional(),
});

export type AddAttachmentInput = z.infer<typeof addAttachmentSchema>;

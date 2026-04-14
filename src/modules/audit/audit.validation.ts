import { z } from 'zod';

export const CreateAuditInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  auditType: z.enum(['internal', 'external', 'supplier']),
  auditScope: z.string().min(1, 'Audit scope is required'),
  auditDate: z.string().datetime(),
  templateId: z.string().optional(),
  auditTeamIds: z.array(z.string()).optional(),
});

export const UpdateAuditInputSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  auditScope: z.string().optional(),
  auditDate: z.string().datetime().optional(),
  status: z.string().optional(),
  templateId: z.string().optional(),
  auditTeamIds: z.array(z.string()).optional(),
});

export const CreateAuditFindingInputSchema = z.object({
  auditId: z.string(),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const UpdateAuditFindingInputSchema = z.object({
  description: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.string().optional(),
  linkedCapaId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const CreateAuditTemplateInputSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  questions: z.array(z.object({
    questionNumber: z.number().positive(),
    question: z.string().min(1),
    category: z.string().optional(),
  })).optional(),
});

export const AuditIdSchema = z.string().regex(/^[a-z0-9]{25}$/, 'Invalid audit ID');

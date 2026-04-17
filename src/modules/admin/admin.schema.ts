import { z } from 'zod';

// Workflow seeding
export const seedWorkflowsInputSchema = z.object({});

// Audit template
export const createAuditTemplateInputSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(1000).optional(),
  questions: z
    .array(
      z.object({
        question: z.string().min(1, 'Question is required').max(1000),
        questionNumber: z.number().int().positive().optional(),
        category: z.string().max(100).optional(),
      })
    )
    .optional(),
});

export const updateAuditTemplateInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
});

export const cloneAuditTemplateInputSchema = z.object({
  sourceTemplateId: z.string().cuid('Invalid template ID'),
  newName: z.string().min(1).max(255),
});

export const archiveAuditTemplateInputSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
});

export const getAuditTemplateInputSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
});

export const getAuditTemplatesInputSchema = z.object({
  includeArchived: z.boolean().optional().default(false),
});

// Exports for type inference
export type SeedWorkflowsInput = z.infer<typeof seedWorkflowsInputSchema>;
export type CreateAuditTemplateInput = z.infer<typeof createAuditTemplateInputSchema>;
export type UpdateAuditTemplateInput = z.infer<typeof updateAuditTemplateInputSchema>;
export type CloneAuditTemplateInput = z.infer<typeof cloneAuditTemplateInputSchema>;
export type ArchiveAuditTemplateInput = z.infer<typeof archiveAuditTemplateInputSchema>;
export type GetAuditTemplateInput = z.infer<typeof getAuditTemplateInputSchema>;
export type GetAuditTemplatesInput = z.infer<typeof getAuditTemplatesInputSchema>;

import { z } from 'zod';

// ID validation
export const supplierIdSchema = z.string().regex(/^[a-z0-9]{25}$/, 'Invalid supplier ID');

// Create supplier
export const createSupplierSchema = z.object({
  name: z.string().min(3, 'Name required').max(255),
  description: z.string().optional(),
  category: z.string().min(2, 'Category required'),
  primaryContact: z.string().email().optional(),
  website: z.string().url().optional().or(z.string().max(0)),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

// Update supplier
export const updateSupplierSchema = z.object({
  id: supplierIdSchema,
  name: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'APPROVED']).optional(),
  primaryContact: z.string().email().optional(),
  website: z.string().url().optional().or(z.string().max(0)),
  ratingScore: z.number().min(1).max(5).optional(),
  complianceScore: z.number().min(0).max(100).optional(),
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

// Add contact
export const addContactSchema = z.object({
  supplierId: supplierIdSchema,
  name: z.string().min(2, 'Name required'),
  role: z.string().min(2, 'Role required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

export type AddContactInput = z.infer<typeof addContactSchema>;

// Create audit
export const createAuditSchema = z.object({
  supplierId: supplierIdSchema,
  auditDate: z.string().datetime(),
  auditType: z.enum(['INITIAL', 'SURVEILLANCE', 'RE-CERTIFICATION']),
  auditScore: z.number().min(0).max(100),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;

// Add audit finding
export const addAuditFindingSchema = z.object({
  auditId: supplierIdSchema,
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(3),
  evidence: z.string().optional(),
});

export type AddAuditFindingInput = z.infer<typeof addAuditFindingSchema>;

// Create evaluation
export const createEvaluationSchema = z.object({
  supplierId: supplierIdSchema,
  evaluationDate: z.string().datetime(),
  qualityScore: z.number().min(0).max(100),
  deliveryScore: z.number().min(0).max(100),
  priceScore: z.number().min(0).max(100),
  notes: z.string().optional(),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;

// Create issue
export const createIssueSchema = z.object({
  supplierId: supplierIdSchema,
  auditId: supplierIdSchema.optional(),
  description: z.string().min(3),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

// Update issue status
export const updateIssueStatusSchema = z.object({
  issueId: supplierIdSchema,
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']),
});

export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>;

// Link issue to CAPA
export const linkIssueToCapaSchema = z.object({
  issueId: supplierIdSchema,
  capaId: z.string().regex(/^[a-z0-9]{25}$/, 'Invalid CAPA ID'),
});

export type LinkIssueToCapaInput = z.infer<typeof linkIssueToCapaSchema>;

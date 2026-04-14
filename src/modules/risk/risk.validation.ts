import { z } from 'zod';

export const CreateRiskInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  riskType: z.enum(['operational', 'compliance', 'strategic', 'financial']),
  process: z.string().min(1, 'Process is required'),
  inherentProbability: z.number().int().min(1).max(5),
  inherentImpact: z.number().int().min(1).max(5),
  ownerId: z.string().optional(),
});

export const UpdateRiskInputSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  process: z.string().optional(),
  status: z.string().optional(),
  inherentProbability: z.number().int().min(1).max(5).optional(),
  inherentImpact: z.number().int().min(1).max(5).optional(),
  residualProbability: z.number().int().min(1).max(5).optional(),
  residualImpact: z.number().int().min(1).max(5).optional(),
  ownerId: z.string().optional(),
});

export const CreateRiskControlInputSchema = z.object({
  riskId: z.string(),
  controlName: z.string().min(1, 'Control name is required'),
  description: z.string().optional(),
  controlType: z.enum(['preventive', 'detective', 'corrective']),
});

export const CreateRiskAssessmentInputSchema = z.object({
  riskId: z.string(),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export const RiskIdSchema = z.string().regex(/^[a-z0-9]{25}$/, 'Invalid risk ID');

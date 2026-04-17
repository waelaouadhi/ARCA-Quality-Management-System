import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload, requireAuthentication } from '@/shared/utils';
import { RiskRepository } from './risk.repository';
import { WorkflowService } from '@/modules/workflow';
import prisma from '@/config/database';
import { z } from 'zod';
import {
  CreateRiskInputSchema,
  UpdateRiskInputSchema,
  CreateRiskControlInputSchema,
  CreateRiskAssessmentInputSchema,
  RiskIdSchema,
} from './risk.validation';

interface CreateRiskInput {
  title: string;
  description?: string;
  riskType: 'operational' | 'compliance' | 'strategic' | 'financial';
  process: string;
  inherentProbability: number;
  inherentImpact: number;
  ownerId?: string;
}

interface UpdateRiskInput {
  title?: string;
  description?: string;
  process?: string;
  status?: string;
  inherentProbability?: number;
  inherentImpact?: number;
  residualProbability?: number;
  residualImpact?: number;
  ownerId?: string;
}

export class RiskService {
  constructor(
    private riskRepository = new RiskRepository(),
    private workflowService = new WorkflowService(prisma)
  ) {}

  private async generateRiskNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.riskRepository.countByYear(year);
    const sequenceNumber = (count + 1).toString().padStart(5, '0');
    return `RISK-${year}-${sequenceNumber}`;
  }

  private calculateRisk(probability: number, impact: number): number {
    return probability * impact;
  }

  async createRisk(input: CreateRiskInput, currentUser?: JWTPayload) {
    try {
      CreateRiskInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      throw new AuthorizationError('Only Admins and Managers can create risks');
    }

    const riskNumber = await this.generateRiskNumber();
    const inherentRisk = this.calculateRisk(input.inherentProbability, input.inherentImpact);

    const risk = await this.riskRepository.createRisk({
      ...input,
      riskNumber,
      inherentRisk,
      createdById: user.userId,
    });

    // Workflow integration would happen here in production

    return risk;
  }

  async getRisks(
    paginationInput: PaginationInput = {},
    filters: { status?: string; riskType?: string } = {},
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);
    return this.riskRepository.getRisks(paginationInput, filters);
  }

  async getRiskById(id: string, currentUser?: JWTPayload) {
    try {
      RiskIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const risk = await this.riskRepository.getRiskById(id);

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    return risk;
  }

  async updateRisk(id: string, input: UpdateRiskInput, currentUser?: JWTPayload) {
    try {
      RiskIdSchema.parse(id);
      UpdateRiskInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const risk = await this.riskRepository.getRiskById(id);

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    // Calculate residual risk if probabilities/impacts provided
    const updateData: any = { ...input };
    if (input.residualProbability && input.residualImpact) {
      updateData.residualRisk = this.calculateRisk(input.residualProbability, input.residualImpact);
    }

    return this.riskRepository.updateRisk(id, updateData);
  }

  async createControl(input: any, currentUser?: JWTPayload) {
    try {
      CreateRiskControlInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const risk = await this.riskRepository.getRiskById(input.riskId);

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    return this.riskRepository.createControl(input);
  }

  async getControls(riskId: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    const risk = await this.riskRepository.getRiskById(riskId);
    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    return this.riskRepository.getControls(riskId);
  }

  async createAssessment(input: any, currentUser?: JWTPayload) {
    try {
      CreateRiskAssessmentInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const risk = await this.riskRepository.getRiskById(input.riskId);

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    const overallRisk = this.calculateRisk(input.probability, input.impact);

    return this.riskRepository.createAssessment({
      ...input,
      assessorId: user.userId,
      assessmentDate: new Date(),
      overallRisk,
    });
  }

  async getAssessments(riskId: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    const risk = await this.riskRepository.getRiskById(riskId);
    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    return this.riskRepository.getAssessments(riskId);
  }

  // Phase 3 Step 5: Track audits that assessed this risk
  async addAuditAssessment(
    riskId: string,
    auditId: string,
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);

    const risk = await this.riskRepository.getRiskById(riskId);
    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    // Add audit to the list of audits that assessed this risk
    const existingAuditIds = risk.sourceAuditIds
      ? JSON.parse(risk.sourceAuditIds)
      : [];

    if (!existingAuditIds.includes(auditId)) {
      existingAuditIds.push(auditId);

      await prisma.risk.update({
        where: { id: riskId },
        data: {
          sourceAuditIds: JSON.stringify(existingAuditIds),
        },
      });
    }

    return risk;
  }

  async getAuditsThatAssessedRisk(
    riskId: string,
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);

    const risk = await this.riskRepository.getRiskById(riskId);
    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    const riskWithAudits = await prisma.risk.findUnique({
      where: { id: riskId },
      include: {
        auditsAssessing: {
          include: { findings: true, createdBy: true },
        },
      },
    });

    return riskWithAudits?.auditsAssessing ?? [];
  }
}

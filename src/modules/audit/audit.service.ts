import { NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload, requireAuthentication, AuthorizationPolicies, createAuthContext } from '@/shared/utils';
import { AuditRepository } from './audit.repository';
import { WorkflowService } from '@/modules/workflow';
import prisma from '@/config/database';
import { z } from 'zod';
import {
  CreateAuditInputSchema,
  UpdateAuditInputSchema,
  CreateAuditFindingInputSchema,
  AuditIdSchema,
} from './audit.validation';

interface CreateAuditInput {
  title: string;
  description?: string;
  auditType: 'internal' | 'external' | 'supplier';
  auditScope: string;
  auditDate: string;
  templateId?: string;
  auditTeamIds?: string[];
}

interface UpdateAuditInput {
  title?: string;
  description?: string;
  auditScope?: string;
  auditDate?: string;
  status?: string;
  templateId?: string;
  auditTeamIds?: string[];
}

interface CreateAuditFindingInput {
  auditId: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string;
  dueDate?: string;
}

export class AuditService {
  constructor(
    private auditRepository = new AuditRepository(),
    private workflowService = new WorkflowService(prisma)
  ) {}

  private async generateAuditNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.auditRepository.countByYear(year);
    const sequenceNumber = (count + 1).toString().padStart(5, '0');
    return `AUDIT-${year}-${sequenceNumber}`;
  }

  async createAudit(input: CreateAuditInput, currentUser?: JWTPayload) {
    try {
      CreateAuditInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    
    // Check authorization - Managers and Admins can create audits
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      throw new ValidationError('Only Admins and Managers can create audits');
    }

    const auditNumber = await this.generateAuditNumber();

    const audit = await this.auditRepository.createAudit({
      ...input,
      auditNumber,
      auditTeamIds: input.auditTeamIds ? JSON.stringify(input.auditTeamIds) : null,
      createdById: user.userId,
    });

    // Workflow integration would happen here in production
    // For now, workflows are optional

    return audit;
  }

  async getAudits(
    paginationInput: PaginationInput = {},
    filters: { status?: string; auditType?: string } = {},
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);
    
    // All authenticated users can view audits
    return this.auditRepository.getAudits(paginationInput, filters);
  }

  async getAuditById(id: string, currentUser?: JWTPayload) {
    try {
      AuditIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const audit = await this.auditRepository.getAuditById(id);

    if (!audit) {
      throw new NotFoundError('Audit not found');
    }

    return audit;
  }

  async updateAudit(id: string, input: UpdateAuditInput, currentUser?: JWTPayload) {
    try {
      AuditIdSchema.parse(id);
      UpdateAuditInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const audit = await this.auditRepository.getAuditById(id);

    if (!audit) {
      throw new NotFoundError('Audit not found');
    }

    // Only creator and admins can update
    if (user.userId !== audit.createdById && user.role !== 'ADMIN') {
      throw new ValidationError('Only creator or admin can update audit');
    }

    return this.auditRepository.updateAudit(id, {
      ...input,
      auditTeamIds: input.auditTeamIds ? JSON.stringify(input.auditTeamIds) : undefined,
    });
  }

  async createFinding(input: CreateAuditFindingInput, currentUser?: JWTPayload) {
    try {
      CreateAuditFindingInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const audit = await this.auditRepository.getAuditById(input.auditId);

    if (!audit) {
      throw new NotFoundError('Audit not found');
    }

    // Get next finding number
    const findings = await this.auditRepository.getAuditFindings(input.auditId);
    const nextFindingNumber = Math.max(...findings.map((f) => f.findingNumber), 0) + 1;

    return this.auditRepository.createFinding({
      auditId: input.auditId,
      findingNumber: nextFindingNumber,
      description: input.description,
      severity: input.severity,
      category: input.category,
      dueDate: input.dueDate,
    });
  }

  async updateFinding(id: string, input: any, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    const finding = await this.auditRepository.getAuditFindings('').catch(() => null);
    if (!finding) {
      throw new NotFoundError('Finding not found');
    }

    return this.auditRepository.updateFinding(id, input);
  }

  async getTemplates(currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);
    return this.auditRepository.getTemplates();
  }

  async createTemplate(data: any, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      throw new ValidationError('Only Admins and Managers can create templates');
    }

    const template = await this.auditRepository.createTemplate({
      name: data.name,
      description: data.description,
    });

    // Create questions if provided
    if (data.questions && data.questions.length > 0) {
      await Promise.all(
        data.questions.map((q: any) =>
          this.auditRepository.createTemplate({
            templateId: template.id,
            questionNumber: q.questionNumber,
            question: q.question,
            category: q.category,
          })
        )
      );
    }

    return template;
  }

  async getAuditWorkflow(id: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);
    const audit = await this.auditRepository.getAuditById(id);

    if (!audit) {
      throw new NotFoundError('Audit not found');
    }

    return this.workflowService.getActiveWorkflow('AUDIT', id);
  }

  async getAuditAvailableTransitions(id: string, currentUser?: JWTPayload) {
    // This will be implemented when workflow engine is ready
    const user = requireAuthentication(currentUser);
    const audit = await this.auditRepository.getAuditById(id);

    if (!audit) {
      throw new NotFoundError('Audit not found');
    }

    return [];
  }

  async getAuditFindings(auditId: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);
    const audit = await this.auditRepository.getAuditById(auditId);

    if (!audit) {
      throw new NotFoundError('Audit not found');
    }

    return this.auditRepository.getAuditFindings(auditId);
  }
}

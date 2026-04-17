import prisma from '@/config/database';
import { AppError, ValidationError, AuthorizationError } from '@/shared/errors';
import { JWTPayload, requireRole } from '@/shared/utils';

/**
 * AdminService
 * Manages admin operations: workflow seeding, template management, metrics, system status
 * All operations require ADMIN role
 */
export class AdminService {
  /**
   * Seed default workflows (audit_lifecycle, risk_lifecycle)
   * Prevents duplicate seeding - returns existing if already seeded
   */
  async seedWorkflows(user: JWTPayload): Promise<{
    success: boolean;
    message: string;
    seededWorkflows: string[];
  }> {
    // Authorization
    requireRole(user, ['ADMIN']);

    try {
      const seeded: string[] = [];

      // Check if already seeded
      const existingAudit = await prisma.workflowSeed.findUnique({
        where: { name: 'audit_lifecycle' },
      });

      if (!existingAudit) {
        // Create audit workflow seed
        await prisma.workflowSeed.create({
          data: {
            name: 'audit_lifecycle',
            description: 'Default audit lifecycle workflow: SCHEDULED → IN_PROGRESS → COMPLETED → CLOSED',
            seededById: user.userId,
            stepCount: 4,
            transitionCount: 3,
          },
        });
        seeded.push('audit_lifecycle');
      }

      // Check if already seeded
      const existingRisk = await prisma.workflowSeed.findUnique({
        where: { name: 'risk_lifecycle' },
      });

      if (!existingRisk) {
        // Create risk workflow seed
        await prisma.workflowSeed.create({
          data: {
            name: 'risk_lifecycle',
            description:
              'Default risk lifecycle workflow: IDENTIFIED → ASSESSED → CONTROLLED → MITIGATED → ACCEPTED',
            seededById: user.userId,
            stepCount: 5,
            transitionCount: 4,
          },
        });
        seeded.push('risk_lifecycle');
      }

      if (seeded.length === 0) {
        return {
          success: true,
          message: 'Workflows already seeded',
          seededWorkflows: [],
        };
      }

      return {
        success: true,
        message: `Successfully seeded ${seeded.length} workflow(s)`,
        seededWorkflows: seeded,
      };
    } catch (error) {
      throw new AppError('Failed to seed workflows', 500);
    }
  }

  /**
   * Get all seeded workflows
   */
  async getSeededWorkflows(user: JWTPayload): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      seededAt: Date;
      stepCount: number;
    }>
  > {
    requireRole(user, ['ADMIN']);

    try {
      return await prisma.workflowSeed.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          seededAt: true,
          stepCount: true,
        },
        orderBy: { seededAt: 'desc' },
      });
    } catch (error) {
      throw new AppError('Failed to get seeded workflows', 500);
    }
  }

  /**
   * Create audit template
   */
  async createAuditTemplate(
    user: JWTPayload,
    input: {
      name: string;
      description?: string;
      questions?: Array<{
        question: string;
        questionNumber?: number;
        category?: string;
      }>;
    }
  ): Promise<{
    id: string;
    name: string;
    description?: string;
    questionCount: number;
  }> {
    // Authorization
    requireRole(user, ['ADMIN']);

    try {
      // Validate input
      if (!input.name || input.name.trim().length === 0) {
        throw new ValidationError('Template name is required');
      }

      // Check if template exists
      const existing = await prisma.auditTemplate.findUnique({
        where: { name: input.name },
      });

      if (existing) {
        throw new ValidationError(`Template "${input.name}" already exists`);
      }

      // Create template with questions
      const template = await prisma.auditTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          questions: {
            createMany: {
              data: (input.questions || []).map((q, idx) => ({
                question: q.question,
                questionNumber: q.questionNumber ?? idx + 1,
                category: q.category,
              })),
            },
          },
        },
        include: {
          questions: true,
        },
      });

      return {
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        questionCount: template.questions.length,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthorizationError) {
        throw error;
      }

      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new ValidationError(`Template "${input.name}" already exists`);
      }

      throw new AppError('Failed to create audit template', 500);
    }
  }

  /**
   * Get all audit templates (including archived)
   */
  async getAuditTemplates(
    user: JWTPayload,
    includeArchived: boolean = false
  ): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      questionCount: number;
      usageCount: number;
      isArchived: boolean;
      createdAt: Date;
    }>
  > {
    requireRole(user, ['ADMIN']);

    try {
      const templates = await prisma.auditTemplate.findMany({
        where: {
          ...(includeArchived ? {} : { isArchived: false }),
        },
        include: {
          questions: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || undefined,
        questionCount: t.questions.length,
        usageCount: t.usageCount,
        isArchived: t.isArchived,
        createdAt: t.createdAt,
      }));
    } catch (error) {
      throw new AppError('Failed to get audit templates', 500);
    }
  }

  /**
   * Get single audit template with all questions
   */
  async getAuditTemplate(
    user: JWTPayload,
    templateId: string
  ): Promise<{
    id: string;
    name: string;
    description?: string;
    questions: Array<{
      id: string;
      questionNumber: number;
      question: string;
      category?: string;
    }>;
    usageCount: number;
    isArchived: boolean;
  }> {
    requireRole(user, ['ADMIN']);

    if (!/^[a-z0-9]{25}$/.test(templateId)) {
      throw new ValidationError('Template not found');
    }

    try {
      const template = await prisma.auditTemplate.findUnique({
        where: { id: templateId },
        include: {
          questions: {
            orderBy: { questionNumber: 'asc' },
            select: {
              id: true,
              questionNumber: true,
              question: true,
              category: true,
            },
          },
        },
      });

      if (!template) {
        throw new ValidationError('Template not found');
      }

      return {
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        questions: template.questions.map((q) => ({
          id: q.id,
          questionNumber: q.questionNumber,
          question: q.question,
          category: q.category || undefined,
        })),
        usageCount: template.usageCount,
        isArchived: template.isArchived,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthorizationError) {
        throw error;
      }
      throw new AppError('Failed to get audit template', 500);
    }
  }

  /**
   * Clone audit template
   */
  async cloneAuditTemplate(
    user: JWTPayload,
    sourceTemplateId: string,
    newName: string
  ): Promise<{
    id: string;
    name: string;
    questionCount: number;
  }> {
    requireRole(user, ['ADMIN']);

    try {
      // Validate new name
      if (!newName || newName.trim().length === 0) {
        throw new ValidationError('New template name is required');
      }

      // Get source template
      const source = await prisma.auditTemplate.findUnique({
        where: { id: sourceTemplateId },
        include: { questions: true },
      });

      if (!source) {
        throw new ValidationError('Source template not found');
      }

      // Check if new name exists
      const existing = await prisma.auditTemplate.findUnique({
        where: { name: newName },
      });

      if (existing) {
        throw new ValidationError(`Template "${newName}" already exists`);
      }

      // Clone template
      const cloned = await prisma.auditTemplate.create({
        data: {
          name: newName,
          description: `Clone of ${source.name}`,
          questions: {
            createMany: {
              data: source.questions.map((q) => ({
                question: q.question,
                questionNumber: q.questionNumber,
                category: q.category,
              })),
            },
          },
        },
        include: { questions: true },
      });

      return {
        id: cloned.id,
        name: cloned.name,
        questionCount: cloned.questions.length,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthorizationError) {
        throw error;
      }
      throw new AppError('Failed to clone audit template', 500);
    }
  }

  /**
   * Archive audit template (soft delete)
   */
  async archiveAuditTemplate(
    user: JWTPayload,
    templateId: string
  ): Promise<{
    id: string;
    name: string;
    isArchived: boolean;
    archivedAt: Date;
  }> {
    requireRole(user, ['ADMIN']);

    try {
      const template = await prisma.auditTemplate.findUnique({
        where: { id: templateId },
        include: { audits: true },
      });

      if (!template) {
        throw new ValidationError('Template not found');
      }

      // Prevent archiving if in use
      if (template.audits.length > 0) {
        throw new ValidationError(
          `Cannot archive template in use by ${template.audits.length} audit(s)`
        );
      }

      // Archive
      const updated = await prisma.auditTemplate.update({
        where: { id: templateId },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          archivedBy: user.userId,
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        isArchived: updated.isArchived,
        archivedAt: updated.archivedAt!,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthorizationError) {
        throw error;
      }
      throw new AppError('Failed to archive audit template', 500);
    }
  }

  /**
   * Update audit template
   */
  async updateAuditTemplate(
    user: JWTPayload,
    templateId: string,
    input: {
      name?: string;
      description?: string;
    }
  ): Promise<{
    id: string;
    name: string;
    description?: string;
  }> {
    requireRole(user, ['ADMIN']);

    try {
      // Get template
      const template = await prisma.auditTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new ValidationError('Template not found');
      }

      // Check if new name is unique
      if (input.name && input.name !== template.name) {
        const existing = await prisma.auditTemplate.findUnique({
          where: { name: input.name },
        });

        if (existing) {
          throw new ValidationError(`Template "${input.name}" already exists`);
        }
      }

      // Update
      const updated = await prisma.auditTemplate.update({
        where: { id: templateId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        description: updated.description || undefined,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthorizationError) {
        throw error;
      }
      throw new AppError('Failed to update audit template', 500);
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(user: JWTPayload): Promise<{
    auditMetrics: {
      totalAudits: number;
      completedAudits: number;
      openAudits: number;
      avgFindingsSeverity: string;
      criticalFindingsCount: number;
    };
    riskMetrics: {
      totalRisks: number;
      identifiedRisks: number;
      controlledRisks: number;
      mitigatedRisks: number;
      avgInherentRisk: number;
      avgResidualRisk: number;
    };
    capaMetrics: {
      totalCapas: number;
      pendingCapas: number;
      completedCapas: number;
      avgCompletionDays: number;
    };
  }> {
    requireRole(user, ['ADMIN']);

    try {
      // Audit metrics
      const audits = await prisma.audit.groupBy({
        by: ['status'],
        _count: true,
      });

      const totalAudits = audits.reduce((sum, a) => sum + a._count, 0);
      const completedAudits =
        audits.find((a) => a.status === 'COMPLETED')?._count || 0;
      const openAudits = audits.find((a) => a.status === 'SCHEDULED')?._count || 0;

      // Finding severity
      const findings = await prisma.auditFinding.groupBy({
        by: ['severity'],
        _count: true,
      });

      const criticalFindings = findings.find(
        (f) => f.severity === 'CRITICAL'
      )?._count || 0;

      // Risk metrics
      const risks = await prisma.risk.groupBy({
        by: ['status'],
        _count: true,
      });

      const totalRisks = risks.reduce((sum, r) => sum + r._count, 0);
      const identifiedRisks =
        risks.find((r) => r.status === 'IDENTIFIED')?._count || 0;
      const controlledRisks =
        risks.find((r) => r.status === 'CONTROLLED')?._count || 0;
      const mitigatedRisks =
        risks.find((r) => r.status === 'MITIGATED')?._count || 0;

      // Calculate average risks
      const riskScores = await prisma.risk.findMany({
        select: {
          inherentRisk: true,
          residualRisk: true,
        },
      });

      const avgInherentRisk =
        riskScores.length > 0
          ? riskScores.reduce((sum, r) => sum + (r.inherentRisk || 0), 0) /
            riskScores.length
          : 0;

      const avgResidualRisk =
        riskScores.length > 0
          ? riskScores.reduce((sum, r) => sum + (r.residualRisk || 0), 0) /
            riskScores.length
          : 0;

      // CAPA metrics
      const capas = await prisma.correctiveAction.groupBy({
        by: ['status'],
        _count: true,
      });

      const totalCapas = capas.reduce((sum, c) => sum + c._count, 0);
      const pendingCapas = capas.find((c) => c.status === 'PENDING')?._count || 0;
      const completedCapas = capas.find((c) => c.status === 'DONE')?._count || 0;

      // Estimate avg completion days
      const completedActions = await prisma.correctiveAction.findMany({
        where: { status: 'DONE', completedAt: { not: null } },
        select: {
          createdAt: true,
          completedAt: true,
        },
        take: 10,
      });

      const avgCompletionDays =
        completedActions.length > 0
          ? Math.round(
              completedActions.reduce((sum, a) => {
                const days = Math.floor(
                  (a.completedAt!.getTime() - a.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return sum + days;
              }, 0) / completedActions.length
            )
          : 0;

      return {
        auditMetrics: {
          totalAudits,
          completedAudits,
          openAudits,
          avgFindingsSeverity:
            criticalFindings > 0 ? 'CRITICAL' : 'MEDIUM',
          criticalFindingsCount: criticalFindings,
        },
        riskMetrics: {
          totalRisks,
          identifiedRisks,
          controlledRisks,
          mitigatedRisks,
          avgInherentRisk: Math.round(avgInherentRisk * 100) / 100,
          avgResidualRisk: Math.round(avgResidualRisk * 100) / 100,
        },
        capaMetrics: {
          totalCapas,
          pendingCapas,
          completedCapas,
          avgCompletionDays,
        },
      };
    } catch (error) {
      throw new AppError('Failed to get dashboard metrics', 500);
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(user: JWTPayload): Promise<{
    databaseConnected: boolean;
    workflowsSeeded: {
      auditLifecycle: boolean;
      riskLifecycle: boolean;
    };
    templatesCount: {
      auditTemplates: number;
      activeAuditTemplates: number;
      archivedAuditTemplates: number;
    };
    recordsCount: {
      audits: number;
      risks: number;
      capas: number;
      users: number;
    };
    lastCheck: Date;
  }> {
    requireRole(user, ['ADMIN']);

    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      // Check workflow seeds
      const auditSeed = await prisma.workflowSeed.findUnique({
        where: { name: 'audit_lifecycle' },
      });
      const riskSeed = await prisma.workflowSeed.findUnique({
        where: { name: 'risk_lifecycle' },
      });

      // Template counts
      const auditTemplates = await prisma.auditTemplate.count();
      const activeAuditTemplates = await prisma.auditTemplate.count({
        where: { isArchived: false },
      });
      const archivedAuditTemplates = await prisma.auditTemplate.count({
        where: { isArchived: true },
      });

      // Record counts
      const auditCount = await prisma.audit.count();
      const riskCount = await prisma.risk.count();
      const capaCount = await prisma.correctiveAction.count();
      const userCount = await prisma.user.count();

      return {
        databaseConnected: true,
        workflowsSeeded: {
          auditLifecycle: !!auditSeed,
          riskLifecycle: !!riskSeed,
        },
        templatesCount: {
          auditTemplates,
          activeAuditTemplates,
          archivedAuditTemplates,
        },
        recordsCount: {
          audits: auditCount,
          risks: riskCount,
          capas: capaCount,
          users: userCount,
        },
        lastCheck: new Date(),
      };
    } catch (error) {
      // Return partial status on error
      return {
        databaseConnected: false,
        workflowsSeeded: {
          auditLifecycle: false,
          riskLifecycle: false,
        },
        templatesCount: {
          auditTemplates: 0,
          activeAuditTemplates: 0,
          archivedAuditTemplates: 0,
        },
        recordsCount: {
          audits: 0,
          risks: 0,
          capas: 0,
          users: 0,
        },
        lastCheck: new Date(),
      };
    }
  }
}

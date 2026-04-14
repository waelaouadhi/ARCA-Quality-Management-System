import { PrismaClient } from '@prisma/client';

export class AdminRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if workflow is already seeded
   */
  async isWorkflowSeeded(workflowName: string): Promise<boolean> {
    const seed = await this.prisma.workflowSeed.findUnique({
      where: { name: workflowName },
    });
    return !!seed;
  }

  /**
   * Get seeded workflows
   */
  async getSeededWorkflows() {
    return this.prisma.workflowSeed.findMany({
      orderBy: { seededAt: 'desc' },
    });
  }

  /**
   * Create workflow seed
   */
  async createWorkflowSeed(data: {
    name: string;
    description: string;
    seededById: string;
    stepCount: number;
    transitionCount: number;
  }) {
    return this.prisma.workflowSeed.create({
      data,
    });
  }

  /**
   * Get audit templates with counts
   */
  async getAuditTemplatesWithMetrics(excludeArchived = true) {
    return this.prisma.auditTemplate.findMany({
      where: excludeArchived ? { isArchived: false } : {},
      include: {
        questions: { select: { id: true } },
        audits: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get dashboard aggregates
   */
  async getAuditCountByStatus() {
    return this.prisma.audit.groupBy({
      by: ['status'],
      _count: true,
    });
  }

  async getRiskCountByStatus() {
    return this.prisma.risk.groupBy({
      by: ['status'],
      _count: true,
    });
  }

  async getCapaCountByStatus() {
    return this.prisma.correctiveAction.groupBy({
      by: ['status'],
      _count: true,
    });
  }

  async getFindingCountBySeverity() {
    return this.prisma.auditFinding.groupBy({
      by: ['severity'],
      _count: true,
    });
  }

  /**
   * Get average risks
   */
  async getAverageRisks() {
    return this.prisma.risk.findMany({
      select: {
        inherentRisk: true,
        residualRisk: true,
      },
    });
  }

  /**
   * Get recent completed actions for avg completion time
   */
  async getRecentCompletedActions(limit = 10) {
    return this.prisma.correctiveAction.findMany({
      where: {
        status: 'DONE',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
      take: limit,
    });
  }

  /**
   * Get system health summary
   */
  async getSystemHealthSummary() {
    return Promise.all([
      this.prisma.audit.count(),
      this.prisma.risk.count(),
      this.prisma.correctiveAction.count(),
      this.prisma.user.count(),
      this.prisma.auditTemplate.count(),
      this.prisma.auditTemplate.count({ where: { isArchived: false } }),
      this.prisma.auditTemplate.count({ where: { isArchived: true } }),
    ]);
  }
}

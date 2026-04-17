import { PrismaClient, DashboardMetricType } from '@prisma/client';
import { DashboardRepository } from './dashboard.repository';

export interface DashboardMetricDTO {
  metricKey: string;
  name: string;
  metricType: DashboardMetricType;
  value: number;
  previousValue?: number;
  target?: number;
  trend?: number; // percentage change
  breakdown?: Record<string, unknown>;
  lastComputedAt: Date;
}

export class DashboardService {
  private repository: DashboardRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new DashboardRepository(prisma);
  }

  // ============================================================================
  // Core Metrics Computation
  // ============================================================================

  /**
   * Get total open Non-Conformances count
   */
  async getOpenNCCount(): Promise<number> {
    const count = await this.prisma.nonConformance.count({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
    });
    return count;
  }

  /**
   * Get Non-Conformances by severity
   */
  async getNCBySeverity(): Promise<Record<string, number>> {
    const results = await this.prisma.nonConformance.groupBy({
      by: ['severity'],
      _count: true,
    });

    const breakdown: Record<string, number> = {};
    results.forEach((r) => {
      breakdown[r.severity] = r._count;
    });

    return breakdown;
  }

  /**
   * Get overdue Non-Conformances percentage
   */
  async getOverdueNCPercentage(): Promise<number> {
    const total = await this.prisma.nonConformance.count();
    if (total === 0) return 0;

    const overdue = await this.prisma.nonConformance.count({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ['CLOSED', 'RESOLVED'],
        },
      },
    });

    return (overdue / total) * 100;
  }

  /**
   * Get total open Corrective Actions count
   */
  async getOpenCACount(): Promise<number> {
    const count = await this.prisma.correctiveAction.count({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });
    return count;
  }

  /**
   * Get Corrective Actions completion rate
   */
  async getCACompletionRate(): Promise<number> {
    const total = await this.prisma.correctiveAction.count();
    if (total === 0) return 0;

    const completed = await this.prisma.correctiveAction.count({
      where: {
        status: 'DONE',
      },
    });

    return (completed / total) * 100;
  }

  /**
   * Get SLA violations count (overdue items)
   */
  async getSLAViolationsCount(): Promise<number> {
    const ncViolations = await this.prisma.nonConformance.count({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ['CLOSED', 'RESOLVED'],
        },
      },
    });

    const caViolations = await this.prisma.correctiveAction.count({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ['DONE'],
        },
      },
    });

    return ncViolations + caViolations;
  }

  /**
   * Get document review pending count
   */
  async getDocumentsAwaitingReviewCount(): Promise<number> {
    const count = await this.prisma.document.count({
      where: {
        status: 'REVIEW',
      },
    });
    return count;
  }

  /**
   * Get escalations active count
   */
  async getActiveEscalationsCount(): Promise<number> {
    const ncEscalations = await this.prisma.nonConformanceEscalation.count({
      where: {
        escalationStatus: 'ACTIVE',
      },
    });

    const caEscalations = await this.prisma.correctiveActionEscalation.count({
      where: {
        escalationStatus: 'ACTIVE',
      },
    });

    return ncEscalations + caEscalations;
  }

  // ============================================================================
  // Dashboard Data Retrieval
  // ============================================================================

  /**
   * Get executive dashboard metrics
   */
  async getExecutiveDashboard(fromDate: Date, toDate: Date): Promise<DashboardMetricDTO[]> {
    const now = new Date();

    // Compute all metrics
    const metrics: DashboardMetricDTO[] = [];

    // Open NC count
    const openNC = await this.getOpenNCCount();
    metrics.push({
      metricKey: 'nc_open_count',
      name: 'Open Non-Conformances',
      metricType: 'COUNT',
      value: openNC,
      lastComputedAt: now,
    });

    // Overdue percentage
    const overduePercent = await this.getOverdueNCPercentage();
    metrics.push({
      metricKey: 'nc_overdue_percentage',
      name: 'Overdue Non-Conformances',
      metricType: 'PERCENTAGE',
      value: overduePercent,
      target: 10, // KPI: keep below 10%
      lastComputedAt: now,
    });

    // CA completion rate
    const caCompletion = await this.getCACompletionRate();
    metrics.push({
      metricKey: 'ca_completion_rate',
      name: 'CAPA Completion Rate',
      metricType: 'PERCENTAGE',
      value: caCompletion,
      target: 85, // KPI: aim for 85%+
      lastComputedAt: now,
    });

    // SLA violations
    const slaViolations = await this.getSLAViolationsCount();
    metrics.push({
      metricKey: 'sla_violations',
      name: 'SLA Violations',
      metricType: 'COUNT',
      value: slaViolations,
      target: 0,
      lastComputedAt: now,
    });

    // Documents awaiting review
    const docReview = await this.getDocumentsAwaitingReviewCount();
    metrics.push({
      metricKey: 'documents_review_pending',
      name: 'Documents Awaiting Review',
      metricType: 'COUNT',
      value: docReview,
      lastComputedAt: now,
    });

    // Active escalations
    const escalations = await this.getActiveEscalationsCount();
    metrics.push({
      metricKey: 'escalations_active',
      name: 'Active Escalations',
      metricType: 'COUNT',
      value: escalations,
      target: 0,
      lastComputedAt: now,
    });

    // NC by severity breakdown
    const ncBySeverity = await this.getNCBySeverity();
    metrics.push({
      metricKey: 'nc_by_severity',
      name: 'Non-Conformances by Severity',
      metricType: 'RATIO',
      value: Object.keys(ncBySeverity).length,
      breakdown: ncBySeverity,
      lastComputedAt: now,
    });

    return metrics;
  }

  /**
   * Refresh all stale metrics in database
   */
  async refreshStaleMetrics(): Promise<number> {
    const staleBefore = new Date(Date.now() - 3600000); // 1 hour ago
    const staleMetrics = await this.repository.getStaleMetrics(staleBefore);

    let refreshedCount = 0;

    for (const metric of staleMetrics) {
      const newValue = await this.computeMetricValue(metric.metricKey);
      if (newValue !== null) {
        await this.repository.updateMetric(metric.id, {
          ...metric,
          value: newValue,
          previousValue: metric.value,
        });
        refreshedCount++;
      }
    }

    return refreshedCount;
  }

  /**
   * Compute a metric value by key
   */
  private async computeMetricValue(metricKey: string): Promise<number | null> {
    switch (metricKey) {
      case 'nc_open_count':
        return await this.getOpenNCCount();
      case 'nc_overdue_percentage':
        return await this.getOverdueNCPercentage();
      case 'ca_completion_rate':
        return await this.getCACompletionRate();
      case 'sla_violations':
        return await this.getSLAViolationsCount();
      case 'documents_review_pending':
        return await this.getDocumentsAwaitingReviewCount();
      case 'escalations_active':
        return await this.getActiveEscalationsCount();
      default:
        return null;
    }
  }

  // ============================================================================
  // Metric Persistence
  // ============================================================================

  /**
   * Persist computed metrics to database
   */
  async persistMetrics(metrics: DashboardMetricDTO[]): Promise<void> {
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date();
    periodEnd.setHours(23, 59, 59, 999);

    for (const metric of metrics) {
      await this.repository.upsertMetric({
        metricType: metric.metricType,
        metricKey: metric.metricKey,
        name: metric.name,
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
        value: metric.value,
        previousValue: metric.previousValue,
        target: metric.target,
        breakdown: metric.breakdown,
      });
    }
  }

  /**
   * Get metrics from database cache
   */
  async getCachedMetrics(): Promise<DashboardMetricDTO[]> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const metrics = await this.repository.getMetricsInDateRange(startOfDay, endOfDay);

    return metrics.map((m) => ({
      metricKey: m.metricKey,
      name: m.name,
      metricType: m.metricType,
      value: m.value,
      previousValue: m.previousValue || undefined,
      target: m.target || undefined,
      breakdown: m.breakdown ? JSON.parse(m.breakdown) : undefined,
      lastComputedAt: m.lastComputedAt,
    }));
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Delete metrics older than specified days
   */
  async cleanupOldMetrics(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return this.repository.deleteOldMetrics(cutoffDate);
  }
}

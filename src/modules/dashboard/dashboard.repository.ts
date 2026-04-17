import { PrismaClient, DashboardMetric, DashboardMetricType, Prisma } from '@prisma/client';
import { NotFoundError } from '@/shared/errors';

export class DashboardRepository {
  constructor(private prisma: PrismaClient) {}

  // ============================================================================
  // Metric CRUD
  // ============================================================================

  async createMetric(data: {
    metricType: DashboardMetricType;
    metricKey: string;
    name: string;
    periodStartDate: Date;
    periodEndDate: Date;
    value: number;
    previousValue?: number;
    target?: number;
    breakdown?: Record<string, unknown>;
    refreshInterval?: number;
  }): Promise<DashboardMetric> {
    return this.prisma.dashboardMetric.create({
      data: {
        metricType: data.metricType,
        metricKey: data.metricKey,
        name: data.name,
        periodStartDate: data.periodStartDate,
        periodEndDate: data.periodEndDate,
        value: data.value,
        previousValue: data.previousValue,
        target: data.target,
        breakdown: data.breakdown ? JSON.stringify(data.breakdown) : null,
        refreshInterval: data.refreshInterval || 3600,
      },
    });
  }

  async getMetricById(id: string): Promise<DashboardMetric | null> {
    return this.prisma.dashboardMetric.findUnique({
      where: { id },
    });
  }

  async getMetricByKey(metricKey: string): Promise<DashboardMetric | null> {
    // Get most recent metric with this key
    return this.prisma.dashboardMetric.findFirst({
      where: { metricKey },
      orderBy: { periodEndDate: 'desc' },
    });
  }

  async getMetricsByType(
    metricType: DashboardMetricType,
    limit = 10
  ): Promise<DashboardMetric[]> {
    return this.prisma.dashboardMetric.findMany({
      where: { metricType },
      orderBy: { periodEndDate: 'desc' },
      take: limit,
    });
  }

  async getMetricsInDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetric[]> {
    return this.prisma.dashboardMetric.findMany({
      where: {
        periodEndDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { metricKey: 'asc' },
    });
  }

  async updateMetric(id: string, data: Partial<DashboardMetric>): Promise<DashboardMetric> {
    const existing = await this.getMetricById(id);
    if (!existing) throw new NotFoundError(`Metric not found: ${id}`);

    return this.prisma.dashboardMetric.update({
      where: { id },
      data: {
        value: data.value,
        previousValue: data.previousValue,
        target: data.target,
        breakdown: data.breakdown ? JSON.stringify(data.breakdown) : undefined,
        lastComputedAt: new Date(),
      },
    });
  }

  async upsertMetric(data: {
    metricType: DashboardMetricType;
    metricKey: string;
    name: string;
    periodStartDate: Date;
    periodEndDate: Date;
    value: number;
    previousValue?: number;
    target?: number;
    breakdown?: Record<string, unknown>;
  }): Promise<DashboardMetric> {
    return this.prisma.dashboardMetric.upsert({
      where: {
        metricKey_periodStartDate_periodEndDate: {
          metricKey: data.metricKey,
          periodStartDate: data.periodStartDate,
          periodEndDate: data.periodEndDate,
        },
      },
      create: {
        metricType: data.metricType,
        metricKey: data.metricKey,
        name: data.name,
        periodStartDate: data.periodStartDate,
        periodEndDate: data.periodEndDate,
        value: data.value,
        previousValue: data.previousValue,
        target: data.target,
        breakdown: data.breakdown ? JSON.stringify(data.breakdown) : null,
      },
      update: {
        value: data.value,
        previousValue: data.previousValue,
        target: data.target,
        breakdown: data.breakdown ? JSON.stringify(data.breakdown) : null,
        lastComputedAt: new Date(),
      },
    });
  }

  async deleteMetric(id: string): Promise<void> {
    await this.prisma.dashboardMetric.delete({
      where: { id },
    });
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  async deleteOldMetrics(beforeDate: Date): Promise<number> {
    const result = await this.prisma.dashboardMetric.deleteMany({
      where: {
        periodEndDate: {
          lt: beforeDate,
        },
      },
    });

    return result.count;
  }

  async getStaleMetrics(staleBefore: Date): Promise<DashboardMetric[]> {
    return this.prisma.dashboardMetric.findMany({
      where: {
        lastComputedAt: {
          lt: staleBefore,
        },
      },
      orderBy: { lastComputedAt: 'asc' },
      take: 100,
    });
  }
}

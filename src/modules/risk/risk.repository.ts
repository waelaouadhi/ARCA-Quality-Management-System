import prisma from '@/config/database';
import { PaginationInput } from '@/shared/utils/pagination';

export class RiskRepository {
  async createRisk(data: any) {
    return prisma.risk.create({ data });
  }

  async getRiskById(id: string) {
    return prisma.risk.findUnique({
      where: { id },
      include: { controls: true, assessments: true, owner: true, createdBy: true },
    });
  }

  async getRisks(paginationInput: PaginationInput = {}, filters: { status?: string; riskType?: string } = {}) {
    const skip = (paginationInput as any)?.skip || 0;
    const take = (paginationInput as any)?.take || 10;
    const risks = await prisma.risk.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.riskType && { riskType: filters.riskType }),
      },
      skip,
      take,
      include: { controls: true, owner: true, createdBy: true },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.risk.count({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.riskType && { riskType: filters.riskType }),
      },
    });

    return { risks, total, skip, take };
  }

  async updateRisk(id: string, data: any) {
    return prisma.risk.update({
      where: { id },
      data,
      include: { controls: true, assessments: true },
    });
  }

  async countByYear(year: number) {
    return prisma.risk.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
  }

  async createControl(data: any) {
    return prisma.riskControl.create({ data });
  }

  async getControls(riskId: string) {
    return prisma.riskControl.findMany({
      where: { riskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateControl(id: string, data: any) {
    return prisma.riskControl.update({
      where: { id },
      data,
    });
  }

  async createAssessment(data: any) {
    return prisma.riskAssessment.create({ data });
  }

  async getAssessments(riskId: string) {
    return prisma.riskAssessment.findMany({
      where: { riskId },
      orderBy: { assessmentDate: 'desc' },
    });
  }

  async getLatestAssessment(riskId: string) {
    return prisma.riskAssessment.findFirst({
      where: { riskId },
      orderBy: { assessmentDate: 'desc' },
    });
  }
}

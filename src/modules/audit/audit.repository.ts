import { PrismaClient } from '@prisma/client';
import { PaginationInput } from '@/shared/utils/pagination';

const prisma = new PrismaClient();

export class AuditRepository {
  async createAudit(data: any) {
    return prisma.audit.create({ data });
  }

  async getAuditById(id: string) {
    return prisma.audit.findUnique({
      where: { id },
      include: { findings: true, template: true, createdBy: true },
    });
  }

  async getAudits(paginationInput: PaginationInput = {}, filters: { status?: string; auditType?: string } = {}) {
    const skip = (paginationInput as any)?.skip || 0;
    const take = (paginationInput as any)?.take || 10;
    const audits = await prisma.audit.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.auditType && { auditType: filters.auditType }),
      },
      skip,
      take,
      include: { findings: true, createdBy: true },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.audit.count({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.auditType && { auditType: filters.auditType }),
      },
    });

    return { audits, total, skip, take };
  }

  async updateAudit(id: string, data: any) {
    return prisma.audit.update({
      where: { id },
      data,
      include: { findings: true },
    });
  }

  async countByYear(year: number) {
    return prisma.audit.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
  }

  async getAuditFindings(auditId: string) {
    return prisma.auditFinding.findMany({
      where: { auditId },
      orderBy: { findingNumber: 'asc' },
    });
  }

  async createFinding(data: any) {
    return prisma.auditFinding.create({ data });
  }

  async updateFinding(id: string, data: any) {
    return prisma.auditFinding.update({
      where: { id },
      data,
    });
  }

  async getTemplates() {
    return prisma.auditTemplate.findMany({
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: string) {
    return prisma.auditTemplate.findUnique({
      where: { id },
      include: { questions: true },
    });
  }

  async createTemplate(data: any) {
    return prisma.auditTemplate.create({ data });
  }
}

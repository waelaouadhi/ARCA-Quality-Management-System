import prisma from '@/config/database';
import { PaginationInput, paginate } from '@/shared/utils/pagination';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type NCStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface CreateNonConformanceInput {
  title: string;
  description: string;
  severity?: Severity;
}

interface UpdateNonConformanceInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: NCStatus;
}

export class NonConformanceRepository {
  createNonConformance(input: CreateNonConformanceInput, reportedById: string) {
    return prisma.nonConformance.create({
      data: {
        title: input.title,
        description: input.description,
        severity: input.severity,
        reportedById,
      },
      include: {
        reportedBy: true,
        correctiveActions: true,
      },
    });
  }

  getNonConformances(
    paginationInput: PaginationInput = {},
    filters: { status?: NCStatus; severity?: Severity; reportedById?: string } = {}
  ) {
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.reportedById ? { reportedById: filters.reportedById } : {}),
    };

    return paginate(prisma.nonConformance, paginationInput, where, {
      reportedBy: true,
      correctiveActions: true,
    });
  }

  getNonConformanceById(id: string) {
    return prisma.nonConformance.findUnique({
      where: { id },
      include: { reportedBy: true, correctiveActions: true },
    });
  }

  updateNonConformance(id: string, input: UpdateNonConformanceInput) {
    return prisma.nonConformance.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: input.status,
      },
      include: { reportedBy: true, correctiveActions: true },
    });
  }

  closeNonConformance(id: string) {
    return prisma.nonConformance.update({
      where: { id },
      data: { status: 'CLOSED' },
      include: { reportedBy: true, correctiveActions: true },
    });
  }
}

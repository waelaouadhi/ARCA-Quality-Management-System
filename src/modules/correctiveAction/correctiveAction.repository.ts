import prisma from '@/config/database';
import { PaginationInput, paginate } from '@/shared/utils/pagination';

type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PLANNED';

interface CreateCorrectiveActionInput {
  action: string;
  nonConformanceId: string;
  assignedToId?: string;
  dueDate?: string;
  capaNumber: string;
  requestStatus?: RequestStatus;
  rootCauseAnalysis?: string;
}

interface UpdateCorrectiveActionInput {
  action?: string;
  assignedToId?: string;
  dueDate?: string;
  status?: ActionStatus;
  rootCauseAnalysis?: string | null;
  requestStatus?: RequestStatus;
  rootCauseAnalyzedAt?: string;
  rootCauseAnalyzedBy?: string;
  completedAt?: string;
  completedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string | null;
}

export class CorrectiveActionRepository {
  /**
   * Count CAPAs created in a specific year.
   * Used for generating sequential CAPA numbers.
   */
  async countByYear(year: number): Promise<number> {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    return prisma.correctiveAction.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  createCorrectiveAction(input: CreateCorrectiveActionInput) {
    return prisma.correctiveAction.create({
      data: {
        action: input.action,
        nonConformanceId: input.nonConformanceId,
        assignedToId: input.assignedToId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        capaNumber: input.capaNumber,
        requestStatus: input.requestStatus || 'PENDING',
        rootCauseAnalysis: input.rootCauseAnalysis,
      },
      include: {
        nonConformance: true,
        assignedTo: true,
      },
    });
  }

  getCorrectiveActions(
    paginationInput: PaginationInput = {},
    filters: { 
      status?: ActionStatus; 
      nonConformanceId?: string; 
      assignedToId?: string;
      requestStatus?: RequestStatus;
    } = {}
  ) {
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.nonConformanceId ? { nonConformanceId: filters.nonConformanceId } : {}),
      ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
      ...(filters.requestStatus ? { requestStatus: filters.requestStatus } : {}),
    };

    return paginate(prisma.correctiveAction, paginationInput, where, {
      nonConformance: true,
      assignedTo: true,
    });
  }

  getCorrectiveActionById(id: string) {
    return prisma.correctiveAction.findUnique({
      where: { id },
      include: { nonConformance: true, assignedTo: true },
    });
  }

  getCorrectiveActionByCapaNumber(capaNumber: string) {
    return prisma.correctiveAction.findUnique({
      where: { capaNumber },
      include: { nonConformance: true, assignedTo: true },
    });
  }

  updateCorrectiveAction(id: string, input: UpdateCorrectiveActionInput) {
    return prisma.correctiveAction.update({
      where: { id },
      data: {
        ...(input.action !== undefined && { action: input.action }),
        ...(input.assignedToId !== undefined && { assignedToId: input.assignedToId }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate ? new Date(input.dueDate) : null }),
        ...(input.rootCauseAnalysis !== undefined && { rootCauseAnalysis: input.rootCauseAnalysis }),
        ...(input.requestStatus !== undefined && { requestStatus: input.requestStatus }),
        ...(input.rootCauseAnalyzedAt !== undefined && { rootCauseAnalyzedAt: new Date(input.rootCauseAnalyzedAt) }),
        ...(input.rootCauseAnalyzedBy !== undefined && { rootCauseAnalyzedBy: input.rootCauseAnalyzedBy }),
        ...(input.completedAt !== undefined && { completedAt: input.completedAt ? new Date(input.completedAt) : null }),
        ...(input.completedBy !== undefined && { completedBy: input.completedBy }),
        ...(input.verifiedAt !== undefined && { verifiedAt: input.verifiedAt ? new Date(input.verifiedAt) : null }),
        ...(input.verifiedBy !== undefined && { verifiedBy: input.verifiedBy }),
        ...(input.verificationNotes !== undefined && { verificationNotes: input.verificationNotes }),
      },
      include: { nonConformance: true, assignedTo: true },
    });
  }

  completeCorrectiveAction(id: string) {
    return prisma.correctiveAction.update({
      where: { id },
      data: { 
        status: 'DONE',
        completedAt: new Date(),
      },
      include: { nonConformance: true, assignedTo: true },
    });
  }

  /**
   * Get CAPAs by request status (e.g., pending approval).
   */
  getCAPAsByRequestStatus(requestStatus: RequestStatus, paginationInput: PaginationInput = {}) {
    return paginate(
      prisma.correctiveAction,
      paginationInput,
      { requestStatus },
      { nonConformance: true, assignedTo: true }
    );
  }

  /**
   * Get overdue CAPAs (dueDate passed, status not DONE).
   */
  getOverdueCAPAs(paginationInput: PaginationInput = {}) {
    const now = new Date();
    
    return paginate(
      prisma.correctiveAction,
      paginationInput,
      {
        AND: [
          { dueDate: { lt: now } },
          { status: { not: 'DONE' } },
        ],
      },
      { nonConformance: true, assignedTo: true }
    );
  }

  /**
   * Get CAPAs pending root cause analysis.
   */
  getPendingRCAAnalysis(paginationInput: PaginationInput = {}) {
    return paginate(
      prisma.correctiveAction,
      paginationInput,
      {
        AND: [
          { rootCauseAnalysis: null },
          { requestStatus: 'PENDING' },
        ],
      },
      { nonConformance: true, assignedTo: true }
    );
  }
}

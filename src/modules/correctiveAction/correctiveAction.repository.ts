import prisma from '@/config/database';
import { PaginationInput, paginate } from '@/shared/utils/pagination';

type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';

interface CreateCorrectiveActionInput {
  action: string;
  nonConformanceId: string;
  assignedToId?: string;
  dueDate?: string;
}

interface UpdateCorrectiveActionInput {
  action?: string;
  assignedToId?: string;
  dueDate?: string;
  status?: ActionStatus;
}

export class CorrectiveActionRepository {
  createCorrectiveAction(input: CreateCorrectiveActionInput) {
    return prisma.correctiveAction.create({
      data: {
        action: input.action,
        nonConformanceId: input.nonConformanceId,
        assignedToId: input.assignedToId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: {
        nonConformance: true,
        assignedTo: true,
      },
    });
  }

  getCorrectiveActions(
    paginationInput: PaginationInput = {},
    filters: { status?: ActionStatus; nonConformanceId?: string; assignedToId?: string } = {}
  ) {
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.nonConformanceId ? { nonConformanceId: filters.nonConformanceId } : {}),
      ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
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

  updateCorrectiveAction(id: string, input: UpdateCorrectiveActionInput) {
    return prisma.correctiveAction.update({
      where: { id },
      data: {
        action: input.action,
        assignedToId: input.assignedToId,
        status: input.status,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: { nonConformance: true, assignedTo: true },
    });
  }

  completeCorrectiveAction(id: string) {
    return prisma.correctiveAction.update({
      where: { id },
      data: { status: 'DONE' },
      include: { nonConformance: true, assignedTo: true },
    });
  }
}

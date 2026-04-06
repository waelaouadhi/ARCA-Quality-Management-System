import prisma from '@/config/database';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
}

export class AuditRepository {
  async createAuditLog(params: CreateAuditLogParams) {
    return prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
      },
    });
  }

  async getAuditLogs(filters: { userId?: string; entity?: string; entityId?: string } = {}) {
    return prisma.auditLog.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.entity && { entity: filters.entity }),
        ...(filters.entityId && { entityId: filters.entityId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

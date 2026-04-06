import logger from '@/config/logger';
import { AuditRepository, CreateAuditLogParams } from './audit.repository';

export class AuditService {
  constructor(private readonly auditRepository = new AuditRepository()) {}

  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await this.auditRepository.createAuditLog(params);
    } catch (error) {
      // Audit logging must never cause the primary operation to fail
      logger.error('Failed to create audit log', { error, params });
    }
  }

  async getAuditLogs(filters: { userId?: string; entity?: string; entityId?: string } = {}) {
    return this.auditRepository.getAuditLogs(filters);
  }
}

export const auditService = new AuditService();

jest.mock('@/modules/audit/audit.repository', () => ({
  AuditRepository: jest.fn().mockImplementation(() => ({
    createAuditLog: jest.fn(),
    getAuditLogs: jest.fn(),
  })),
}));

jest.mock('@/config/logger', () => {
  const mockLogger = { error: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn() };
  return { __esModule: true, default: mockLogger };
});

import { AuditService } from '@/modules/audit/audit.service';
import { AuditRepository } from '@/modules/audit/audit.repository';

describe('AuditService', () => {
  let auditRepository: jest.Mocked<InstanceType<typeof AuditRepository>>;
  let auditService: AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    auditRepository = new (AuditRepository as jest.MockedClass<typeof AuditRepository>)() as jest.Mocked<
      InstanceType<typeof AuditRepository>
    >;
    auditService = new AuditService(auditRepository as never);
  });

  it('creates an audit log entry', async () => {
    auditRepository.createAuditLog.mockResolvedValue({
      id: 'log1',
      action: 'CREATE',
      entity: 'Document',
      entityId: 'doc1',
      userId: 'u1',
      createdAt: new Date(),
    });

    await auditService.log({ userId: 'u1', action: 'CREATE', entity: 'Document', entityId: 'doc1' });

    expect(auditRepository.createAuditLog).toHaveBeenCalledWith({
      userId: 'u1',
      action: 'CREATE',
      entity: 'Document',
      entityId: 'doc1',
    });
  });

  it('creates audit log without userId (system action)', async () => {
    auditRepository.createAuditLog.mockResolvedValue({
      id: 'log2',
      action: 'DELETE',
      entity: 'User',
      entityId: 'u1',
      userId: null,
      createdAt: new Date(),
    });

    await auditService.log({ action: 'DELETE', entity: 'User', entityId: 'u1' });

    expect(auditRepository.createAuditLog).toHaveBeenCalledWith({
      action: 'DELETE',
      entity: 'User',
      entityId: 'u1',
    });
  });

  it('does not throw when repository fails (never breaks primary operation)', async () => {
    auditRepository.createAuditLog.mockRejectedValue(new Error('DB connection failed'));

    await expect(
      auditService.log({ userId: 'u1', action: 'UPDATE', entity: 'Document', entityId: 'doc1' })
    ).resolves.not.toThrow();
  });

  it('returns audit logs for given filters', async () => {
    const logs = [
      { id: 'l1', action: 'CREATE', entity: 'Document', entityId: 'd1', userId: 'u1', createdAt: new Date() },
    ];
    auditRepository.getAuditLogs.mockResolvedValue(logs);

    const result = await auditService.getAuditLogs({ userId: 'u1' });

    expect(auditRepository.getAuditLogs).toHaveBeenCalledWith({ userId: 'u1' });
    expect(result).toEqual(logs);
  });
});

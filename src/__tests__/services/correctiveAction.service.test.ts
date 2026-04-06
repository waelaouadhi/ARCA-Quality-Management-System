jest.mock('@/modules/audit/audit.service', () => ({
  auditService: { log: jest.fn() },
}));

import { CorrectiveActionService } from '@/modules/correctiveAction/correctiveAction.service';
import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';

const adminUser = { userId: 'a1', email: 'admin@qms.com', role: 'ADMIN' as const };
const normalUser = { userId: 'u1', email: 'user@qms.com', role: 'USER' as const };

const validCreateInput = {
  action: 'Update labeling SOP and retrain all staff members',
  nonConformanceId: 'n1',
};

describe('CorrectiveActionService', () => {
  const createRepository = () => ({
    createCorrectiveAction: jest.fn(),
    getCorrectiveActions: jest.fn(),
    getCorrectiveActionById: jest.fn(),
    updateCorrectiveAction: jest.fn(),
    completeCorrectiveAction: jest.fn(),
  });

  it('creates corrective action for ADMIN', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    const created = { id: 'c1', ...validCreateInput };
    repository.createCorrectiveAction.mockResolvedValue(created);

    const result = await service.createCorrectiveAction(validCreateInput, adminUser);

    expect(repository.createCorrectiveAction).toHaveBeenCalledWith(validCreateInput);
    expect(result).toEqual(created);
  });

  it('rejects create for USER role', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);

    await expect(
      service.createCorrectiveAction(validCreateInput, normalUser)
    ).rejects.toThrow('CorrectiveAction write access requires ADMIN or MANAGER role');
  });

  it('rejects create with action description too short', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);

    await expect(
      service.createCorrectiveAction({ action: 'Fix it', nonConformanceId: 'n1' }, adminUser)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws not found when completing missing action', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue(null);

    await expect(service.completeCorrectiveAction('missing', adminUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects completing action already done', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue({ id: 'c1', status: 'DONE' });

    await expect(service.completeCorrectiveAction('c1', adminUser)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.completeCorrectiveAction).not.toHaveBeenCalled();
  });

  it('completes action when workflow is valid', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue({ id: 'c1', status: 'IN_PROGRESS' });
    repository.completeCorrectiveAction.mockResolvedValue({ id: 'c1', status: 'DONE' });

    const result = await service.completeCorrectiveAction('c1', adminUser);

    expect(repository.completeCorrectiveAction).toHaveBeenCalledWith('c1');
    expect(result).toEqual({ id: 'c1', status: 'DONE' });
  });

  it('rejects reads when unauthenticated', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);

    await expect(service.getCorrectiveActions({ page: 1, limit: 10 }, {})).rejects.toMatchObject({ statusCode: 403 });
  });

  it('updates corrective action with valid input', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    repository.updateCorrectiveAction.mockResolvedValue({ id: 'c1', status: 'IN_PROGRESS' });

    const result = await service.updateCorrectiveAction('c1', { status: 'IN_PROGRESS' }, adminUser);

    expect(repository.updateCorrectiveAction).toHaveBeenCalledWith('c1', { status: 'IN_PROGRESS' });
    expect(result).toEqual({ id: 'c1', status: 'IN_PROGRESS' });
  });

  it('rejects update with invalid status value', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);

    await expect(
      service.updateCorrectiveAction('c1', { status: 'INVALID' as never }, adminUser)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.updateCorrectiveAction).not.toHaveBeenCalled();
  });
});

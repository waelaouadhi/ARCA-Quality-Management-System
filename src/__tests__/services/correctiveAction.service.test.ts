import { CorrectiveActionService } from '@/modules/correctiveAction/correctiveAction.service';
import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';

const adminUser = { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'admin@qms.com', role: 'ADMIN' as const };
const normalUser = { userId: '550e8400-e29b-41d4-a716-446655440001', email: 'user@qms.com', role: 'USER' as const };

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
    const created = { id: 'a1', action: 'Fix label' };
    repository.createCorrectiveAction.mockResolvedValue(created);

    const result = await service.createCorrectiveAction(
      { action: 'Fix label', nonConformanceId: '550e8400-e29b-41d4-a716-446655440010' },
      adminUser
    );

    expect(result).toEqual(created);
  });

  it('rejects create for USER role', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);

    await expect(
      service.createCorrectiveAction({ action: 'Fix label', nonConformanceId: '550e8400-e29b-41d4-a716-446655440011' }, normalUser)
    ).rejects.toThrow('Insufficient permissions for this action');
  });

  it('throws not found when completing missing action', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue(null);

    await expect(service.completeCorrectiveAction('550e8400-e29b-41d4-a716-446655440012', adminUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects completing action already done', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440013', status: 'DONE' });

    await expect(service.completeCorrectiveAction('550e8400-e29b-41d4-a716-446655440013', adminUser)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.completeCorrectiveAction).not.toHaveBeenCalled();
  });

  it('completes action when workflow is valid', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440014', status: 'PENDING' });
    repository.completeCorrectiveAction.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440014', status: 'DONE' });

    const result = await service.completeCorrectiveAction('550e8400-e29b-41d4-a716-446655440014', adminUser);

    expect(repository.completeCorrectiveAction).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440014');
    expect(result).toEqual({ id: '550e8400-e29b-41d4-a716-446655440014', status: 'DONE' });
  });

  it('rejects reads when unauthenticated', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);

    await expect(service.getCorrectiveActions({ page: 1, limit: 10 }, {})).rejects.toMatchObject({ statusCode: 403 });
  });
});

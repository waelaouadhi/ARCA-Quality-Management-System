import { CorrectiveActionService } from '@/modules/correctiveAction/correctiveAction.service';
import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';

const adminUser = { userId: 'caaaaaaaaaaaaaaaaaaaaaaa', email: 'admin@qms.com', role: 'ADMIN' as const };
const normalUser = { userId: 'cbbbbbbbbbbbbbbbbbbbbbbb', email: 'user@qms.com', role: 'USER' as const };

describe('CorrectiveActionService', () => {
  const createRepository = () => ({
    countByYear: jest.fn().mockResolvedValue(0),
    createCorrectiveAction: jest.fn(),
    getCorrectiveActions: jest.fn(),
    getCorrectiveActionById: jest.fn(),
    updateCorrectiveAction: jest.fn(),
  });

  it('creates corrective action for ADMIN', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    const created = { id: 'a1', action: 'Fix label' };
    repository.createCorrectiveAction.mockResolvedValue(created);

    const result = await service.createCorrectiveAction(
      { action: 'Fix label', nonConformanceId: 'ccccccccccccccccccccccccc' },
      adminUser
    );

    expect(result).toEqual(created);
  });

  it('rejects create for USER role', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);

    await expect(
      service.createCorrectiveAction({ action: 'Fix label', nonConformanceId: 'cdddddddddddddddddddddddd' }, normalUser)
    ).rejects.toThrow('Insufficient permissions for this action');
  });

  it('throws not found when completing missing action', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue(null);

    await expect(service.completeCorrectiveAction('ceeeeeeeeeeeeeeeeeeeeeeee', adminUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects completing action already done', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue({ id: 'cffffffffffffffffffffffff', status: 'DONE' });

    await expect(service.completeCorrectiveAction('cffffffffffffffffffffffff', adminUser)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.updateCorrectiveAction).not.toHaveBeenCalled();
  });

  it('completes action when workflow is valid', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);
    repository.getCorrectiveActionById.mockResolvedValue({
      id: 'cgggggggggggggggggggggggg',
      status: 'PENDING',
      rootCauseAnalysis: 'Root cause analysis text',
      requestStatus: 'ACCEPTED',
    });
    repository.updateCorrectiveAction.mockResolvedValue({ id: 'cgggggggggggggggggggggggg', status: 'DONE' });

    const result = await service.completeCorrectiveAction('cgggggggggggggggggggggggg', adminUser);

    expect(repository.updateCorrectiveAction).toHaveBeenCalledWith(
      'cgggggggggggggggggggggggg',
      expect.objectContaining({ status: 'DONE' })
    );
    expect(result).toEqual({ id: 'cgggggggggggggggggggggggg', status: 'DONE' });
  });

  it('rejects reads when unauthenticated', async () => {
    const repository = createRepository();
    const service = new CorrectiveActionService(repository as never);

    await expect(service.getCorrectiveActions({ page: 1, limit: 10 }, {})).rejects.toMatchObject({ statusCode: 403 });
  });
});

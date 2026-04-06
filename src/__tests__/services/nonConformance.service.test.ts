import { NonConformanceService } from '@/modules/nonConformance/nonConformance.service';
import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';

const managerUser = { userId: 'm1', email: 'manager@qms.com', role: 'MANAGER' as const };
const normalUser = { userId: 'u1', email: 'user@qms.com', role: 'USER' as const };

describe('NonConformanceService', () => {
  const createRepository = () => ({
    createNonConformance: jest.fn(),
    getNonConformances: jest.fn(),
    getNonConformanceById: jest.fn(),
    updateNonConformance: jest.fn(),
    closeNonConformance: jest.fn(),
  });

  it('creates non-conformance for MANAGER', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    const created = { id: 'n1', title: 'Issue' };
    repository.createNonConformance.mockResolvedValue(created);

    const result = await service.createNonConformance(
      { title: 'Issue', description: 'Desc', severity: 'HIGH' },
      managerUser
    );

    expect(repository.createNonConformance).toHaveBeenCalledWith(
      { title: 'Issue', description: 'Desc', severity: 'HIGH' },
      'm1'
    );
    expect(result).toEqual(created);
  });

  it('rejects create for USER role', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);

    await expect(
      service.createNonConformance({ title: 'Issue', description: 'Desc', severity: 'HIGH' }, normalUser)
    ).rejects.toThrow('NonConformance write access requires ADMIN or MANAGER role');
  });

  it('throws not found when closing missing non-conformance', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue(null);

    await expect(service.closeNonConformance('missing', managerUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects closing an already closed non-conformance', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue({ id: 'n1', status: 'CLOSED' });

    await expect(service.closeNonConformance('n1', managerUser)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.closeNonConformance).not.toHaveBeenCalled();
  });

  it('closes non-conformance when workflow is valid', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue({ id: 'n1', status: 'OPEN' });
    repository.closeNonConformance.mockResolvedValue({ id: 'n1', status: 'CLOSED' });

    const result = await service.closeNonConformance('n1', managerUser);

    expect(repository.closeNonConformance).toHaveBeenCalledWith('n1');
    expect(result).toEqual({ id: 'n1', status: 'CLOSED' });
  });

  it('rejects reads when unauthenticated', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);

    await expect(service.getNonConformances({ page: 1, limit: 10 }, {})).rejects.toMatchObject({ statusCode: 403 });
  });
});

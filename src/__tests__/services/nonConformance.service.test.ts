import { NonConformanceService } from '@/modules/nonConformance/nonConformance.service';
import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';

const managerUser = { userId: 'caaaaaaaaaaaaaaaaaaaaaaa', email: 'manager@qms.com', role: 'MANAGER' as const };
const normalUser = { userId: 'cbbbbbbbbbbbbbbbbbbbbbbb', email: 'user@qms.com', role: 'USER' as const };

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
      { title: 'Issue', description: 'This is a detailed description', severity: 'HIGH' },
      managerUser
    );

    expect(repository.createNonConformance).toHaveBeenCalledWith(
      { title: 'Issue', description: 'This is a detailed description', severity: 'HIGH' },
      'caaaaaaaaaaaaaaaaaaaaaaa'
    );
    expect(result).toEqual(created);
  });

  it('creates non-conformance for USER role', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    const created = { id: 'n1', title: 'Issue' };
    repository.createNonConformance.mockResolvedValue(created);

    const result = await service.createNonConformance(
      { title: 'Issue', description: 'This is a detailed description', severity: 'HIGH' },
      normalUser
    );

    expect(repository.createNonConformance).toHaveBeenCalledWith(
      { title: 'Issue', description: 'This is a detailed description', severity: 'HIGH' },
      'cbbbbbbbbbbbbbbbbbbbbbbb'
    );
    expect(result).toEqual(created);
  });

  it('throws not found when closing missing non-conformance', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue(null);

    await expect(service.closeNonConformance('ccccccccccccccccccccccccc', managerUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects closing an already closed non-conformance', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue({ id: 'cdddddddddddddddddddddddd', status: 'CLOSED' });

    await expect(service.closeNonConformance('cdddddddddddddddddddddddd', managerUser)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.closeNonConformance).not.toHaveBeenCalled();
  });

  it('closes non-conformance when workflow is valid', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue({ id: 'ceeeeeeeeeeeeeeeeeeeeeeee', status: 'OPEN' });
    repository.closeNonConformance.mockResolvedValue({ id: 'ceeeeeeeeeeeeeeeeeeeeeeee', status: 'CLOSED' });

    const result = await service.closeNonConformance('ceeeeeeeeeeeeeeeeeeeeeeee', managerUser);

    expect(repository.closeNonConformance).toHaveBeenCalledWith('ceeeeeeeeeeeeeeeeeeeeeeee');
    expect(result).toEqual({ id: 'ceeeeeeeeeeeeeeeeeeeeeeee', status: 'CLOSED' });
  });

  it('rejects reads when unauthenticated', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);

    await expect(service.getNonConformances({ page: 1, limit: 10 }, {})).rejects.toMatchObject({ statusCode: 403 });
  });
});

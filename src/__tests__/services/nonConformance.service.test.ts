import { NonConformanceService } from '@/modules/nonConformance/nonConformance.service';
import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';

const managerUser = { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'manager@qms.com', role: 'MANAGER' as const };
const normalUser = { userId: '550e8400-e29b-41d4-a716-446655440001', email: 'user@qms.com', role: 'USER' as const };

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
      '550e8400-e29b-41d4-a716-446655440000'
    );
    expect(result).toEqual(created);
  });

  it('rejects create for USER role', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);

    await expect(
      service.createNonConformance({ title: 'Issue', description: 'This is a detailed description', severity: 'HIGH' }, normalUser)
    ).rejects.toThrow('NonConformance write access requires ADMIN or MANAGER role');
  });

  it('throws not found when closing missing non-conformance', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue(null);

    await expect(service.closeNonConformance('550e8400-e29b-41d4-a716-446655440002', managerUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects closing an already closed non-conformance', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440003', status: 'CLOSED' });

    await expect(service.closeNonConformance('550e8400-e29b-41d4-a716-446655440003', managerUser)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.closeNonConformance).not.toHaveBeenCalled();
  });

  it('closes non-conformance when workflow is valid', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440004', status: 'OPEN' });
    repository.closeNonConformance.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440004', status: 'CLOSED' });

    const result = await service.closeNonConformance('550e8400-e29b-41d4-a716-446655440004', managerUser);

    expect(repository.closeNonConformance).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440004');
    expect(result).toEqual({ id: '550e8400-e29b-41d4-a716-446655440004', status: 'CLOSED' });
  });

  it('rejects reads when unauthenticated', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);

    await expect(service.getNonConformances({ page: 1, limit: 10 }, {})).rejects.toMatchObject({ statusCode: 403 });
  });
});

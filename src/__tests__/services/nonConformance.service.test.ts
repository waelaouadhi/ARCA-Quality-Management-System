jest.mock('@/modules/audit/audit.service', () => ({
  auditService: { log: jest.fn() },
}));

import { NonConformanceService } from '@/modules/nonConformance/nonConformance.service';
import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';

const managerUser = { userId: 'm1', email: 'manager@qms.com', role: 'MANAGER' as const };
const normalUser = { userId: 'u1', email: 'user@qms.com', role: 'USER' as const };

const validInput = {
  title: 'Product Label Mismatch',
  description: 'Batch has incorrect expiration date on labels',
  severity: 'HIGH' as const,
};

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
    const created = { id: 'n1', ...validInput };
    repository.createNonConformance.mockResolvedValue(created);

    const result = await service.createNonConformance(validInput, managerUser);

    expect(repository.createNonConformance).toHaveBeenCalledWith(validInput, 'm1');
    expect(result).toEqual(created);
  });

  it('rejects create for USER role', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);

    await expect(
      service.createNonConformance(validInput, normalUser)
    ).rejects.toThrow('NonConformance write access requires ADMIN or MANAGER role');
  });

  it('rejects create with description too short', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);

    await expect(
      service.createNonConformance({ title: 'Issue', description: 'Short', severity: 'HIGH' }, managerUser)
    ).rejects.toMatchObject({ statusCode: 400 });
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

  it('updates non-conformance with valid input', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);
    repository.getNonConformanceById.mockResolvedValue({ id: 'n1', status: 'OPEN' });
    repository.updateNonConformance.mockResolvedValue({ id: 'n1', severity: 'CRITICAL' });

    const result = await service.updateNonConformance('n1', { severity: 'CRITICAL' }, managerUser);

    expect(repository.updateNonConformance).toHaveBeenCalledWith('n1', { severity: 'CRITICAL' });
    expect(result).toEqual({ id: 'n1', severity: 'CRITICAL' });
  });

  it('rejects update with invalid severity', async () => {
    const repository = createRepository();
    const service = new NonConformanceService(repository as never);

    await expect(
      service.updateNonConformance('n1', { severity: 'EXTREME' as never }, managerUser)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.updateNonConformance).not.toHaveBeenCalled();
  });
});

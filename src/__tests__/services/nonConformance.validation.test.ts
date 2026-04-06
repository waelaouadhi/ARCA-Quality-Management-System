import { NonConformanceService } from '@/modules/nonConformance/nonConformance.service';
import { ValidationError } from '@/shared/errors';

const managerUser = { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'manager@qms.com', role: 'MANAGER' as const };

describe('NonConformanceService - Validation Tests', () => {
  const createRepository = () => ({
    createNonConformance: jest.fn(),
    getNonConformances: jest.fn(),
    getNonConformanceById: jest.fn(),
    updateNonConformance: jest.fn(),
    closeNonConformance: jest.fn(),
  });

  describe('createNonConformance validation', () => {
    it('rejects title too short', async () => {
      const repository = createRepository();
      const service = new NonConformanceService(repository as never);

      await expect(
        service.createNonConformance(
          { title: 'ab', description: 'Valid description here', severity: 'HIGH' },
          managerUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects description too short', async () => {
      const repository = createRepository();
      const service = new NonConformanceService(repository as never);

      await expect(
        service.createNonConformance(
          { title: 'Valid Title', description: 'Short', severity: 'HIGH' },
          managerUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects description too long', async () => {
      const repository = createRepository();
      const service = new NonConformanceService(repository as never);
      const longDesc = 'a'.repeat(5001);

      await expect(
        service.createNonConformance(
          { title: 'Valid Title', description: longDesc, severity: 'HIGH' },
          managerUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects invalid severity', async () => {
      const repository = createRepository();
      const service = new NonConformanceService(repository as never);

      await expect(
        service.createNonConformance(
          { title: 'Valid Title', description: 'Valid description', severity: 'INVALID' as any },
          managerUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getNonConformanceById validation', () => {
    it('rejects invalid UUID', async () => {
      const repository = createRepository();
      const service = new NonConformanceService(repository as never);

      await expect(
        service.getNonConformanceById('not-uuid', managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('updateNonConformance validation', () => {
    it('rejects invalid ID', async () => {
      const repository = createRepository();
      const service = new NonConformanceService(repository as never);

      await expect(
        service.updateNonConformance('bad-id', { title: 'New' }, managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects empty update', async () => {
      const repository = createRepository();
      const service = new NonConformanceService(repository as never);

      await expect(
        service.updateNonConformance('550e8400-e29b-41d4-a716-446655440001', {}, managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('closeNonConformance validation', () => {
    it('rejects invalid UUID', async () => {
      const repository = createRepository();
      const service = new NonConformanceService(repository as never);

      await expect(
        service.closeNonConformance('invalid', managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});

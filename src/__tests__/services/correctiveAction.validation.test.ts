import { CorrectiveActionService } from '@/modules/correctiveAction/correctiveAction.service';

const adminUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'admin@qms.com',
  role: 'ADMIN' as const,
};

describe('CorrectiveActionService - Validation Tests', () => {
  const createRepository = () => ({
    findCorrectiveActionById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findManyByNonConformanceId: jest.fn(),
  });

  describe('createCorrectiveAction validation', () => {
    it('rejects action too short', async () => {
      const repository = createRepository();
      const service = new CorrectiveActionService(repository as never);

      await expect(
        service.createCorrectiveAction(
          {
            action: 'Fix',
            nonConformanceId: '550e8400-e29b-41d4-a716-446655440001',
          },
          adminUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects action too long', async () => {
      const repository = createRepository();
      const service = new CorrectiveActionService(repository as never);

      await expect(
        service.createCorrectiveAction(
          {
            action: 'x'.repeat(1001),
            nonConformanceId: '550e8400-e29b-41d4-a716-446655440001',
          },
          adminUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects invalid nonConformanceId UUID', async () => {
      const repository = createRepository();
      const service = new CorrectiveActionService(repository as never);

      await expect(
        service.createCorrectiveAction(
          {
            action: 'Fix the issue',
            nonConformanceId: 'not-a-uuid',
          },
          adminUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getCorrectiveActionById validation', () => {
    it('rejects invalid UUID', async () => {
      const repository = createRepository();
      const service = new CorrectiveActionService(repository as never);

      await expect(
        service.getCorrectiveActionById('invalid-id', adminUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('updateCorrectiveAction validation', () => {
    it('rejects empty update', async () => {
      const repository = createRepository();
      const service = new CorrectiveActionService(repository as never);

      await expect(
        service.updateCorrectiveAction('550e8400-e29b-41d4-a716-446655440002', {}, adminUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects invalid action length', async () => {
      const repository = createRepository();
      const service = new CorrectiveActionService(repository as never);

      await expect(
        service.updateCorrectiveAction(
          '550e8400-e29b-41d4-a716-446655440002',
          { action: 'x' },
          adminUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});

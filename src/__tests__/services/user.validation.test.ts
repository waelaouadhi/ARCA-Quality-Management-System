import { UserService } from '@/modules/user/user.service';

const adminUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'admin@qms.com',
  role: 'ADMIN' as const,
};

describe('UserService - Validation Tests', () => {
  const createRepository = () => ({
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  });

  describe('getUserById validation', () => {
    it('rejects invalid UUID format', async () => {
      const repository = createRepository();
      const service = new UserService(repository as never);

      await expect(
        service.getUserById('not-a-uuid', adminUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('updateUser validation', () => {
    it('rejects empty update', async () => {
      const repository = createRepository();
      const service = new UserService(repository as never);

      await expect(
        service.updateUser('550e8400-e29b-41d4-a716-446655440001', {}, adminUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects weak password', async () => {
      const repository = createRepository();
      const service = new UserService(repository as never);

      await expect(
        service.updateUser(
          '550e8400-e29b-41d4-a716-446655440001',
          { password: 'weak' },
          adminUser
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('deleteUser validation', () => {
    it('rejects invalid UUID', async () => {
      const repository = createRepository();
      const service = new UserService(repository as never);

      await expect(
        service.deleteUser('invalid-uuid', adminUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});

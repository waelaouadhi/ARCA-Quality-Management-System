import { UserService } from '@/modules/user/user.service';
import { AuthorizationError, NotFoundError } from '@/shared/errors';

const adminUser = { userId: 'a1', email: 'admin@qms.com', role: 'ADMIN' as const };
const normalUser = { userId: 'u1', email: 'user@qms.com', role: 'USER' as const };

describe('UserService', () => {
  const createRepository = () => ({
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  });

  it('returns users for authenticated user', async () => {
    const repository = createRepository();
    const service = new UserService(repository as never);
    const output = { data: [{ id: 'u1' }], pagination: { page: 1 } };
    repository.getUsers.mockResolvedValue(output);

    const result = await service.getUsers({ page: 1, limit: 10 }, normalUser);

    expect(repository.getUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(result).toEqual(output);
  });

  it('rejects users list when unauthenticated', async () => {
    const repository = createRepository();
    const service = new UserService(repository as never);

    await expect(service.getUsers({ page: 1, limit: 10 })).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws not found for missing user', async () => {
    const repository = createRepository();
    const service = new UserService(repository as never);
    repository.getUserById.mockResolvedValue(null);

    await expect(service.getUserById('missing', adminUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects delete for non-admin user', async () => {
    const repository = createRepository();
    const service = new UserService(repository as never);

    await expect(service.deleteUser('u2', normalUser)).rejects.toThrow('Admin access required');
  });

  it('deletes user for admin', async () => {
    const repository = createRepository();
    const service = new UserService(repository as never);
    repository.deleteUser.mockResolvedValue(undefined);

    const result = await service.deleteUser('u2', adminUser);

    expect(repository.deleteUser).toHaveBeenCalledWith('u2');
    expect(result).toBe(true);
  });
});

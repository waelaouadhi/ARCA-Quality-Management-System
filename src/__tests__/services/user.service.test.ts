jest.mock('@/modules/audit/audit.service', () => ({
  auditService: { log: jest.fn() },
}));

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

  it('updates user with valid data', async () => {
    const repository = createRepository();
    const service = new UserService(repository as never);
    repository.updateUser.mockResolvedValue({ id: 'u1', firstName: 'Jane' });

    const result = await service.updateUser('u1', { firstName: 'Jane' }, normalUser);

    expect(repository.updateUser).toHaveBeenCalledWith('u1', { firstName: 'Jane' });
    expect(result).toEqual({ id: 'u1', firstName: 'Jane' });
  });

  it('rejects update with invalid email', async () => {
    const repository = createRepository();
    const service = new UserService(repository as never);

    await expect(
      service.updateUser('u1', { email: 'not-an-email' }, normalUser)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.updateUser).not.toHaveBeenCalled();
  });

  it('rejects update when unauthenticated', async () => {
    const repository = createRepository();
    const service = new UserService(repository as never);

    await expect(service.updateUser('u1', { firstName: 'Jane' })).rejects.toMatchObject({ statusCode: 403 });
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

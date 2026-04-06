jest.mock('@/shared/utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('@/shared/utils/jwt', () => ({
  generateToken: jest.fn(),
}));

import { AuthService } from '@/modules/auth/auth.service';
import { AuthenticationError, ConflictError, NotFoundError } from '@/shared/errors';
import { hashPassword, comparePassword } from '@/shared/utils/password';
import { generateToken } from '@/shared/utils/jwt';

describe('AuthService', () => {
  const createRepository = () => ({
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user and returns token', async () => {
    const repository = createRepository();
    const service = new AuthService(repository as never);
    repository.findUserByEmail.mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashed-password');
    repository.createUser.mockResolvedValue({
      id: 'u1',
      email: 'john@qms.com',
      role: 'USER',
      password: 'hashed-password',
    });
    (generateToken as jest.Mock).mockReturnValue('jwt-token');

    const result = await service.register('john@qms.com', 'secret', 'John', 'Doe');

    expect(repository.createUser).toHaveBeenCalledWith({
      email: 'john@qms.com',
      password: 'hashed-password',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(result).toEqual({
      user: { id: 'u1', email: 'john@qms.com', role: 'USER', password: 'hashed-password' },
      token: 'jwt-token',
    });
  });

  it('rejects register for existing email', async () => {
    const repository = createRepository();
    const service = new AuthService(repository as never);
    repository.findUserByEmail.mockResolvedValue({ id: 'existing' });

    await expect(service.register('john@qms.com', 'secret', 'John', 'Doe')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects login when user does not exist', async () => {
    const repository = createRepository();
    const service = new AuthService(repository as never);
    repository.findUserByEmail.mockResolvedValue(null);

    await expect(service.login('john@qms.com', 'secret')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects login when password is invalid', async () => {
    const repository = createRepository();
    const service = new AuthService(repository as never);
    repository.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'john@qms.com', role: 'USER', password: 'hash' });
    (comparePassword as jest.Mock).mockResolvedValue(false);

    await expect(service.login('john@qms.com', 'bad-secret')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('logs in user and returns token', async () => {
    const repository = createRepository();
    const service = new AuthService(repository as never);
    repository.findUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'john@qms.com',
      role: 'USER',
      password: 'hash',
    });
    (comparePassword as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue('jwt-token');

    const result = await service.login('john@qms.com', 'secret');

    expect(result).toEqual({
      user: { id: 'u1', email: 'john@qms.com', role: 'USER', password: 'hash' },
      token: 'jwt-token',
    });
  });

  it('rejects getCurrentUser when unauthenticated', async () => {
    const repository = createRepository();
    const service = new AuthService(repository as never);

    await expect(service.getCurrentUser()).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws not found when current user is missing in repository', async () => {
    const repository = createRepository();
    const service = new AuthService(repository as never);
    repository.findUserById.mockResolvedValue(null);

    await expect(
      service.getCurrentUser({ userId: 'u1', email: 'john@qms.com', role: 'USER' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

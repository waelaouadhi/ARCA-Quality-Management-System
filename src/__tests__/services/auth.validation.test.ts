import { AuthService } from '@/modules/auth/auth.service';

describe('AuthService - Validation Tests', () => {
  const createRepository = () => ({
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
  });

  describe('register validation', () => {
    it('rejects invalid email format', async () => {
      const repository = createRepository();
      const service = new AuthService(repository as never);

      await expect(
        service.register('not-an-email', 'SecurePass123', 'John', 'Doe')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects short password', async () => {
      const repository = createRepository();
      const service = new AuthService(repository as never);

      await expect(
        service.register('john@qms.com', 'Short1', 'John', 'Doe')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects password without uppercase', async () => {
      const repository = createRepository();
      const service = new AuthService(repository as never);

      await expect(
        service.register('john@qms.com', 'lowercase123', 'John', 'Doe')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects password without lowercase', async () => {
      const repository = createRepository();
      const service = new AuthService(repository as never);

      await expect(
        service.register('john@qms.com', 'UPPERCASE123', 'John', 'Doe')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects password without number', async () => {
      const repository = createRepository();
      const service = new AuthService(repository as never);

      await expect(
        service.register('john@qms.com', 'NoNumbers', 'John', 'Doe')
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('login validation', () => {
    it('rejects invalid email format', async () => {
      const repository = createRepository();
      const service = new AuthService(repository as never);

      await expect(
        service.login('invalid-email', 'password123')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects empty password', async () => {
      const repository = createRepository();
      const service = new AuthService(repository as never);

      await expect(
        service.login('john@qms.com', '')
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});

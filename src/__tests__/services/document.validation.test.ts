import { DocumentService } from '@/modules/document/document.service';
import { ValidationError } from '@/shared/errors';

const managerUser = { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'manager@qms.com', role: 'MANAGER' as const };

describe('DocumentService - Validation Tests', () => {
  const createRepository = () => ({
    createDocument: jest.fn(),
    getDocuments: jest.fn(),
    getDocumentById: jest.fn(),
    updateDocument: jest.fn(),
    archiveDocument: jest.fn(),
  });

  describe('createDocument validation', () => {
    it('rejects title too short', async () => {
      const repository = createRepository();
      const service = new DocumentService(repository as never);

      await expect(
        service.createDocument({ title: 'ab', content: 'Content' }, managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects title too long', async () => {
      const repository = createRepository();
      const service = new DocumentService(repository as never);
      const longTitle = 'a'.repeat(201);

      await expect(
        service.createDocument({ title: longTitle, content: 'Content' }, managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects content too long', async () => {
      const repository = createRepository();
      const service = new DocumentService(repository as never);
      const longContent = 'a'.repeat(50001);

      await expect(
        service.createDocument({ title: 'Valid Title', content: longContent }, managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getDocumentById validation', () => {
    it('rejects invalid document ID format', async () => {
      const repository = createRepository();
      const service = new DocumentService(repository as never);

      await expect(
        service.getDocumentById('not-cuid', managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('updateDocument validation', () => {
    it('rejects invalid document ID', async () => {
      const repository = createRepository();
      const service = new DocumentService(repository as never);

      await expect(
        service.updateDocument('bad-id', { title: 'New Title' }, managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects empty update', async () => {
      const repository = createRepository();
      const service = new DocumentService(repository as never);

      await expect(
        service.updateDocument('c0ldwxvzrn000qzrmn831aljf', {}, managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('archiveDocument validation', () => {
    it('rejects invalid document ID format', async () => {
      const repository = createRepository();
      const service = new DocumentService(repository as never);

      await expect(
        service.archiveDocument('invalid', managerUser)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});

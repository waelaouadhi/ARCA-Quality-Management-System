import { DocumentService } from '@/modules/document/document.service';
import { AuthorizationError, NotFoundError } from '@/shared/errors';

const managerUser = { userId: 'm1', email: 'manager@qms.com', role: 'MANAGER' as const };
const normalUser = { userId: 'u1', email: 'user@qms.com', role: 'USER' as const };

describe('DocumentService', () => {
  const createRepository = () => ({
    createDocument: jest.fn(),
    getDocuments: jest.fn(),
    getDocumentById: jest.fn(),
    updateDocument: jest.fn(),
    archiveDocument: jest.fn(),
  });

  it('creates document for MANAGER', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);
    const created = { id: 'd1', title: 'SOP-1' };
    repository.createDocument.mockResolvedValue(created);

    const result = await service.createDocument({ title: 'SOP-1', content: 'Body' }, managerUser);

    expect(repository.createDocument).toHaveBeenCalledWith({ title: 'SOP-1', content: 'Body' }, 'm1');
    expect(result).toEqual(created);
  });

  it('rejects create for USER role', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);

    await expect(service.createDocument({ title: 'SOP-1' }, normalUser)).rejects.toThrow(
      'Document write access requires ADMIN or MANAGER role'
    );
  });

  it('returns paginated documents for authenticated user', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);
    const output = { data: [{ id: 'd1' }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.getDocuments.mockResolvedValue(output);

    const result = await service.getDocuments({ page: 1, limit: 10 }, 'DRAFT', managerUser);

    expect(repository.getDocuments).toHaveBeenCalledWith({ page: 1, limit: 10 }, 'DRAFT');
    expect(result).toEqual(output);
  });

  it('rejects read when unauthenticated', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);

    await expect(service.getDocuments({ page: 1, limit: 10 }, 'DRAFT')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws not found for missing document', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);
    repository.getDocumentById.mockResolvedValue(null);

    await expect(service.getDocumentById('missing', managerUser)).rejects.toMatchObject({ statusCode: 404 });
  });
});

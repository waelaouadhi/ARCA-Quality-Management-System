import { DocumentService } from '@/modules/document/document.service';
import { AuthorizationError, NotFoundError } from '@/shared/errors';

const managerUser = { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'manager@qms.com', role: 'MANAGER' as const };
const normalUser = { userId: '550e8400-e29b-41d4-a716-446655440001', email: 'user@qms.com', role: 'USER' as const };

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
    const created = { id: 'd1', title: 'SOP 001' };
    repository.createDocument.mockResolvedValue(created);

    const result = await service.createDocument({ title: 'SOP 001', content: 'Content' }, managerUser);

    expect(result).toEqual(created);
  });

  it('rejects create for USER role', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);

    await expect(service.createDocument({ title: 'SOP 001', content: 'Content' }, normalUser)).rejects.toThrow(
      'Insufficient permissions for this action'
    );
  });

  it('lists documents for authenticated users', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);
    const docs = { data: [{ id: 'd1', title: 'SOP' }], pagination: { page: 1 } };
    repository.getDocuments.mockResolvedValue(docs);

    const result = await service.getDocuments({}, undefined, normalUser);

    expect(repository.getDocuments).toHaveBeenCalled();
    expect(result).toEqual(docs);
  });

  it('rejects list for unauthenticated request', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);

    await expect(service.getDocuments({})).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws not found for missing document', async () => {
    const repository = createRepository();
    const service = new DocumentService(repository as never);
    repository.getDocumentById.mockResolvedValue(null);

    await expect(service.getDocumentById('550e8400-e29b-41d4-a716-446655440010', managerUser)).rejects.toMatchObject({ statusCode: 404 });
  });
});

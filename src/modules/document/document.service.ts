import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload } from '@/shared/utils/jwt';
import { CreateDocumentSchema, UpdateDocumentSchema } from '@/shared/validation/schemas';
import { auditService } from '@/modules/audit/audit.service';
import { DocumentRepository } from './document.repository';

interface CreateDocumentInput {
  title: string;
  content?: string;
}

interface UpdateDocumentInput {
  title?: string;
  content?: string;
  version?: number;
  status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED';
}

const DOCUMENT_WRITE_ROLES = new Set(['ADMIN', 'MANAGER']);

export class DocumentService {
  constructor(private readonly documentRepository = new DocumentRepository()) {}

  private requireAuthenticatedUser(user?: JWTPayload): JWTPayload {
    if (!user) {
      throw new AuthorizationError();
    }

    return user;
  }

  private requireDocumentWriteRole(user?: JWTPayload): JWTPayload {
    const currentUser = this.requireAuthenticatedUser(user);
    if (!DOCUMENT_WRITE_ROLES.has(currentUser.role)) {
      throw new AuthorizationError('Document write access requires ADMIN or MANAGER role');
    }

    return currentUser;
  }

  async createDocument(input: CreateDocumentInput, currentUser?: JWTPayload) {
    const user = this.requireDocumentWriteRole(currentUser);

    const validation = CreateDocumentSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError(validation.error.errors.map((e) => e.message).join('; '));
    }

    const document = await this.documentRepository.createDocument(validation.data, user.userId);

    await auditService.log({
      userId: user.userId,
      action: 'CREATE',
      entity: 'Document',
      entityId: document.id,
    });

    return document;
  }

  async getDocuments(
    paginationInput: PaginationInput = {},
    status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED',
    currentUser?: JWTPayload
  ) {
    this.requireAuthenticatedUser(currentUser);
    return this.documentRepository.getDocuments(paginationInput, status);
  }

  async getDocumentById(id: string, currentUser?: JWTPayload) {
    this.requireAuthenticatedUser(currentUser);
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    return document;
  }

  async updateDocument(id: string, input: UpdateDocumentInput, currentUser?: JWTPayload) {
    const user = this.requireDocumentWriteRole(currentUser);

    const validation = UpdateDocumentSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError(validation.error.errors.map((e) => e.message).join('; '));
    }

    await this.getDocumentById(id, currentUser);
    const updated = await this.documentRepository.updateDocument(id, validation.data);

    await auditService.log({
      userId: user.userId,
      action: 'UPDATE',
      entity: 'Document',
      entityId: id,
    });

    return updated;
  }

  async archiveDocument(id: string, currentUser?: JWTPayload) {
    const user = this.requireDocumentWriteRole(currentUser);
    await this.getDocumentById(id, currentUser);
    const archived = await this.documentRepository.archiveDocument(id);

    await auditService.log({
      userId: user.userId,
      action: 'ARCHIVE',
      entity: 'Document',
      entityId: id,
    });

    return archived;
  }
}

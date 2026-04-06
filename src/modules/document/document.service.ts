import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload } from '@/shared/utils/jwt';
import { DocumentRepository } from './document.repository';
import { z } from 'zod';
import {
  CreateDocumentInputSchema,
  UpdateDocumentInputSchema,
  DocumentIdSchema,
} from './document.validation';

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
    try {
      CreateDocumentInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = this.requireDocumentWriteRole(currentUser);
    return this.documentRepository.createDocument(input, user.userId);
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
    try {
      DocumentIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    this.requireAuthenticatedUser(currentUser);
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    return document;
  }

  async updateDocument(id: string, input: UpdateDocumentInput, currentUser?: JWTPayload) {
    try {
      DocumentIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    try {
      UpdateDocumentInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    this.requireDocumentWriteRole(currentUser);
    await this.getDocumentById(id, currentUser);
    return this.documentRepository.updateDocument(id, input);
  }

  async archiveDocument(id: string, currentUser?: JWTPayload) {
    try {
      DocumentIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    this.requireDocumentWriteRole(currentUser);
    await this.getDocumentById(id, currentUser);
    return this.documentRepository.archiveDocument(id);
  }
}

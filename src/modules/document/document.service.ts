import { NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload, requireAuthentication, AuthorizationPolicies, createAuthContext } from '@/shared/utils';
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

export class DocumentService {
  constructor(private readonly documentRepository = new DocumentRepository()) {}

  async createDocument(input: CreateDocumentInput, currentUser?: JWTPayload) {
    try {
      CreateDocumentInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    
    // Check authorization
    AuthorizationPolicies.document.create().authorize(createAuthContext(user, 'create'));

    return this.documentRepository.createDocument(input, user.userId);
  }

  async getDocuments(
    paginationInput: PaginationInput = {},
    status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED',
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);
    
    // Check authorization
    AuthorizationPolicies.document.read().authorize(createAuthContext(user, 'read'));

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

    const user = requireAuthentication(currentUser);
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Check authorization
    AuthorizationPolicies.document.read().authorize(
      createAuthContext(user, 'read', { createdById: document.createdById })
    );

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

    const user = requireAuthentication(currentUser);
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Resource-based authorization: ADMIN/MANAGER or creator can update
    AuthorizationPolicies.document.update().authorize(
      createAuthContext(user, 'update', { createdById: document.createdById })
    );

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

    const user = requireAuthentication(currentUser);
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Resource-based authorization: ADMIN/MANAGER or creator can archive
    AuthorizationPolicies.document.update().authorize(
      createAuthContext(user, 'update', { createdById: document.createdById })
    );

    return this.documentRepository.archiveDocument(id);
  }
}

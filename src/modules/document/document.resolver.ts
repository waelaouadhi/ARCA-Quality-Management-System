import { AuthContext } from '@/shared/types/context';
import { DocumentService } from './document.service';

const documentService = new DocumentService();

export const documentResolvers = {
  Query: {
    documents: async (_: unknown, args: any, context: AuthContext) =>
      documentService.getDocuments(args.pagination, args.status, context.user),
    document: async (_: unknown, args: any, context: AuthContext) =>
      documentService.getDocumentById(args.id, context.user),
  },
  Mutation: {
    createDocument: async (_: unknown, args: any, context: AuthContext) =>
      documentService.createDocument(args.input, context.user),
    updateDocument: async (_: unknown, args: any, context: AuthContext) =>
      documentService.updateDocument(args.id, args.input, context.user),
    archiveDocument: async (_: unknown, args: any, context: AuthContext) =>
      documentService.archiveDocument(args.id, context.user),
  },
};

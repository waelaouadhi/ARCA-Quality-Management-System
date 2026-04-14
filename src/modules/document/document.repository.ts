import prisma from '@/config/database';
import { PaginationInput, paginate } from '@/shared/utils/pagination';

type DocStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED';

interface CreateDocumentInput {
  title: string;
  content?: string;
  status?: DocStatus;
}

interface UpdateDocumentInput {
  title?: string;
  content?: string;
  version?: number;
  status?: DocStatus;
}

export class DocumentRepository {
  createDocument(input: CreateDocumentInput, createdById: string) {
    return prisma.document.create({
      data: {
        title: input.title,
        content: input.content,
        status: input.status,
        createdById,
      },
      include: {
        createdBy: true,
      },
    });
  }

  getDocuments(paginationInput: PaginationInput = {}, status?: DocStatus) {
    const where = status ? { status } : {};
    return paginate(prisma.document, paginationInput, where, { createdBy: true });
  }

  getDocumentById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: { createdBy: true },
    });
  }

  updateDocument(id: string, input: UpdateDocumentInput) {
    return prisma.document.update({
      where: { id },
      data: input,
      include: { createdBy: true },
    });
  }

  archiveDocument(id: string) {
    return prisma.document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: { createdBy: true },
    });
  }
}

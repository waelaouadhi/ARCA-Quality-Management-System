import prisma from '@/config/database';

export class ComplaintRepository {
  private async generateComplaintNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.complaint.count();
    return `CMPL-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async createComplaint(data: {
    title: string;
    description: string;
    category: string;
    source: string;
    severity?: string;
    reportedDate: Date;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    reportedBy?: string;
  }) {
    const complaintNumber = await this.generateComplaintNumber();
    return prisma.complaint.create({
      data: {
        complaintNumber,
        ...data,
      },
      include: { investigation: true, attachments: true, linkedCapas: true },
    });
  }

  async findById(id: string) {
    return prisma.complaint.findUnique({
      where: { id },
      include: {
        investigation: true,
        attachments: true,
        linkedRisk: true,
        linkedCapas: true,
      },
    });
  }

  async findAll(skip = 0, take = 10) {
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        skip,
        take,
        include: { investigation: true, attachments: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count(),
    ]);
    return { complaints, total };
  }

  async findByStatus(status: string, skip = 0, take = 10) {
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where: { status },
        skip,
        take,
        include: { investigation: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where: { status } }),
    ]);
    return { complaints, total };
  }

  async update(id: string, data: any) {
    return prisma.complaint.update({
      where: { id },
      data,
      include: { investigation: true, attachments: true },
    });
  }

  async createInvestigation(complaintId: string, data: any) {
    return prisma.complaintInvestigation.create({
      data: { complaintId, ...data },
    });
  }

  async getInvestigation(complaintId: string) {
    return prisma.complaintInvestigation.findUnique({
      where: { complaintId },
    });
  }

  async addAttachment(complaintId: string, data: any) {
    return prisma.complaintAttachment.create({
      data: { complaintId, ...data },
    });
  }

  async getAttachments(complaintId: string) {
    return prisma.complaintAttachment.findMany({
      where: { complaintId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getComplaintsBySeverity(severity: string, skip = 0, take = 10) {
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where: { severity },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where: { severity } }),
    ]);
    return { complaints, total };
  }

  async getStatistics() {
    const [total, open, high, critical] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.complaint.count({ where: { severity: 'HIGH' } }),
      prisma.complaint.count({ where: { severity: 'CRITICAL' } }),
    ]);
    return { total, open, high, critical };
  }
}

export const complaintRepository = new ComplaintRepository();

import prisma from '@/config/database';
import { Supplier, SupplierContact, SupplierAudit, SupplierAuditFinding, SupplierEvaluation, SupplierIssue } from '@prisma/client';

export class SupplierRepository {
  /**
   * Create a new supplier
   */
  async createSupplier(data: {
    supplierNumber: string;
    name: string;
    description?: string;
    category: string;
    primaryContact?: string;
    website?: string;
  }) {
    const supplier = await prisma.supplier.create({
      data,
      include: {
        contacts: true,
        audits: true,
      },
    });

    return supplier;
  }

  /**
   * Find supplier by ID with relationships
   */
  async findSupplierById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        contacts: true,
        audits: { include: { findings: true } },
        evaluations: true,
        issues: true,
        linkedRisks: true,
      },
    });
  }

  /**
   * Find supplier by supplier number
   */
  async findSupplierByNumber(supplierNumber: string) {
    return prisma.supplier.findUnique({
      where: { supplierNumber },
      include: {
        contacts: true,
        audits: true,
        evaluations: true,
        issues: true,
      },
    });
  }

  /**
   * Get all suppliers with pagination
   */
  async getAllSuppliers(skip: number = 0, take: number = 10) {
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        skip,
        take,
        include: {
          contacts: true,
          audits: true,
          evaluations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count(),
    ]);

    return { suppliers, total };
  }

  /**
   * Get suppliers by category
   */
  async getSuppliersByCategory(category: string, skip: number = 0, take: number = 10) {
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: { category },
        skip,
        take,
        include: { contacts: true, audits: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where: { category } }),
    ]);

    return { suppliers, total };
  }

  /**
   * Get suppliers by status
   */
  async getSuppliersByStatus(status: string, skip: number = 0, take: number = 10) {
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: { status },
        skip,
        take,
        include: { contacts: true, audits: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where: { status } }),
    ]);

    return { suppliers, total };
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, data: Partial<Supplier>) {
    return prisma.supplier.update({
      where: { id },
      data,
      include: { contacts: true, audits: true },
    });
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string) {
    return prisma.supplier.delete({
      where: { id },
    });
  }

  /**
   * Add contact to supplier
   */
  async addContact(supplierId: string, data: {
    name: string;
    role: string;
    email: string;
    phone?: string;
  }): Promise<SupplierContact> {
    return prisma.supplierContact.create({
      data: {
        supplierId,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
      },
    });
  }

  /**
   * Get supplier contacts
   */
  async getContacts(supplierId: string) {
    return prisma.supplierContact.findMany({
      where: { supplierId },
    });
  }

  /**
   * Create supplier audit
   */
  async createAudit(supplierId: string, data: {
    auditDate: Date;
    auditType: string;
    auditScore: number;
    status?: string;
  }): Promise<SupplierAudit> {
    const audit = await prisma.supplierAudit.create({
      data: {
        supplierId,
        auditNumber: '',  // Will be set in service
        auditDate: data.auditDate,
        auditType: data.auditType,
        auditScore: data.auditScore,
        status: data.status || 'PLANNED',
      },
    });

    return audit;
  }

  /**
   * Get supplier audits
   */
  async getAudits(supplierId: string, skip: number = 0, take: number = 10) {
    const [audits, total] = await Promise.all([
      prisma.supplierAudit.findMany({
        where: { supplierId },
        skip,
        take,
        include: { findings: true },
        orderBy: { auditDate: 'desc' },
      }),
      prisma.supplierAudit.count({ where: { supplierId } }),
    ]);

    return { audits, total };
  }

  /**
   * Add audit finding
   */
  async addAuditFinding(auditId: string, data: {
    severity: string;
    description: string;
    evidence?: string;
  }): Promise<SupplierAuditFinding> {
    return prisma.supplierAuditFinding.create({
      data: {
        auditId,
        severity: data.severity,
        description: data.description,
        evidence: data.evidence,
      },
    });
  }

  /**
   * Get audit findings
   */
  async getAuditFindings(auditId: string) {
    return prisma.supplierAuditFinding.findMany({
      where: { auditId },
    });
  }

  /**
   * Create supplier evaluation
   */
  async createEvaluation(supplierId: string, data: {
    evaluationDate: Date;
    qualityScore: number;
    deliveryScore: number;
    priceScore: number;
    notes?: string;
  }): Promise<SupplierEvaluation> {
    const overallScore = (data.qualityScore + data.deliveryScore + data.priceScore) / 3;

    return prisma.supplierEvaluation.create({
      data: {
        supplierId,
        evaluationDate: data.evaluationDate,
        qualityScore: data.qualityScore,
        deliveryScore: data.deliveryScore,
        priceScore: data.priceScore,
        overallScore,
        notes: data.notes,
      },
    });
  }

  /**
   * Get supplier evaluations
   */
  async getEvaluations(supplierId: string, skip: number = 0, take: number = 10) {
    const [evaluations, total] = await Promise.all([
      prisma.supplierEvaluation.findMany({
        where: { supplierId },
        skip,
        take,
        orderBy: { evaluationDate: 'desc' },
      }),
      prisma.supplierEvaluation.count({ where: { supplierId } }),
    ]);

    return { evaluations, total };
  }

  /**
   * Create supplier issue
   */
  async createIssue(supplierId: string, data: {
    auditId?: string;
    description: string;
    severity: string;
  }): Promise<SupplierIssue> {
    return prisma.supplierIssue.create({
      data: {
        supplierId,
        auditId: data.auditId,
        description: data.description,
        severity: data.severity,
      },
    });
  }

  /**
   * Get supplier issues
   */
  async getIssues(supplierId: string, skip: number = 0, take: number = 10) {
    const [issues, total] = await Promise.all([
      prisma.supplierIssue.findMany({
        where: { supplierId },
        skip,
        take,
        include: { linkedCapas: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplierIssue.count({ where: { supplierId } }),
    ]);

    return { issues, total };
  }

  /**
   * Update supplier issue status
   */
  async updateIssueStatus(issueId: string, status: string) {
    return prisma.supplierIssue.update({
      where: { id: issueId },
      data: { status, updatedAt: new Date() },
    });
  }

  /**
   * Link issue to CAPA
   */
  async linkIssueToCapa(issueId: string, capaId: string) {
    return prisma.correctiveAction.update({
      where: { id: capaId },
      data: { supplierIssueId: issueId },
    });
  }

  /**
   * Get highest rated suppliers
   */
  async getTopSuppliers(limit: number = 10) {
    return prisma.supplier.findMany({
      take: limit,
      orderBy: { ratingScore: 'desc' },
      include: { audits: true, evaluations: true },
    });
  }

  /**
   * Get lowest performing suppliers (compliance alerts)
   */
  async getLowPerformingSuppliers(complianceThreshold: number = 50, limit: number = 10) {
    return prisma.supplier.findMany({
      where: { complianceScore: { lt: complianceThreshold } },
      take: limit,
      orderBy: { complianceScore: 'asc' },
      include: { issues: true },
    });
  }

  /**
   * Count suppliers by status
   */
  async getSupplierCountByStatus() {
    const counts = await prisma.supplier.groupBy({
      by: ['status'],
      _count: true,
    });

    return counts;
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStatistics() {
    const [totalSuppliers, activeSuppliers, suspendedSuppliers, avgRating] = await Promise.all([
      prisma.supplier.count(),
      prisma.supplier.count({ where: { status: 'ACTIVE' } }),
      prisma.supplier.count({ where: { status: 'SUSPENDED' } }),
      prisma.supplier.aggregate({
        _avg: { ratingScore: true },
      }),
    ]);

    return {
      totalSuppliers,
      activeSuppliers,
      suspendedSuppliers,
      avgRating: avgRating._avg.ratingScore || 0,
    };
  }
}

export const supplierRepository = new SupplierRepository();

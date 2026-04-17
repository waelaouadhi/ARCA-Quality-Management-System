import prisma from '@/config/database';
import { JWTPayload, requireRole } from '@/shared/utils';
import { AppError, ValidationError, NotFoundError } from '@/shared/errors';
import { supplierRepository } from './supplier.repository';
import {
  CreateSupplierInput,
  UpdateSupplierInput,
  AddContactInput,
  CreateAuditInput,
  AddAuditFindingInput,
  CreateEvaluationInput,
  CreateIssueInput,
  UpdateIssueStatusInput,
  LinkIssueToCapaInput,
} from './supplier.validation';

export class SupplierService {
  private nextSupplierNumber = 1;
  private nextAuditNumber = 1;

  /**
   * Generate sequential supplier number (SUPP-2026-00001)
   */
  private async generateSupplierNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.supplier.count();
    const number = String(count + 1).padStart(5, '0');
    return `SUPP-${year}-${number}`;
  }

  /**
   * Generate sequential audit number (SUPP-AUDIT-2026-00001)
   */
  private async generateAuditNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.supplierAudit.count();
    const number = String(count + 1).padStart(5, '0');
    return `SUPP-AUDIT-${year}-${number}`;
  }

  /**
   * Create a new supplier (requires MANAGER or ADMIN)
   */
  async createSupplier(user: JWTPayload, input: CreateSupplierInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const supplierNumber = await this.generateSupplierNumber();

    const supplier = await supplierRepository.createSupplier({
      supplierNumber,
      name: input.name,
      description: input.description,
      category: input.category,
      primaryContact: input.primaryContact,
      website: input.website,
    });

    return supplier;
  }

  /**
   * Get supplier by ID
   */
  async getSupplier(supplierId: string) {
    const supplier = await supplierRepository.findSupplierById(supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplier;
  }

  /**
   * Get all suppliers
   */
  async getAllSuppliers(skip?: number, take?: number) {
    return supplierRepository.getAllSuppliers(skip, take);
  }

  /**
   * Get suppliers by category
   */
  async getSuppliersByCategory(category: string, skip?: number, take?: number) {
    return supplierRepository.getSuppliersByCategory(category, skip, take);
  }

  /**
   * Get suppliers by status
   */
  async getSuppliersByStatus(status: string, skip?: number, take?: number) {
    return supplierRepository.getSuppliersByStatus(status, skip, take);
  }

  /**
   * Update supplier (requires MANAGER or ADMIN)
   */
  async updateSupplier(user: JWTPayload, input: UpdateSupplierInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const supplier = await this.getSupplier(input.id);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    const updated = await supplierRepository.updateSupplier(input.id, {
      ...(input.name && { name: input.name }),
      ...(input.description && { description: input.description }),
      ...(input.category && { category: input.category }),
      ...(input.status && { status: input.status }),
      ...(input.primaryContact && { primaryContact: input.primaryContact }),
      ...(input.website && { website: input.website }),
      ...(input.ratingScore !== undefined && { ratingScore: input.ratingScore }),
      ...(input.complianceScore !== undefined && { complianceScore: input.complianceScore }),
    });

    return updated;
  }

  /**
   * Delete supplier (requires ADMIN)
   */
  async deleteSupplier(user: JWTPayload, supplierId: string) {
    requireRole(user, ['ADMIN']);

    const supplier = await this.getSupplier(supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplierRepository.deleteSupplier(supplierId);
  }

  /**
   * Add contact to supplier (requires MANAGER or ADMIN)
   */
  async addContact(user: JWTPayload, input: AddContactInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const supplier = await this.getSupplier(input.supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplierRepository.addContact(input.supplierId, {
      name: input.name,
      role: input.role,
      email: input.email,
      phone: input.phone,
    });
  }

  /**
   * Get supplier contacts
   */
  async getContacts(supplierId: string) {
    const supplier = await this.getSupplier(supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplierRepository.getContacts(supplierId);
  }

  /**
   * Create supplier audit (requires MANAGER or ADMIN)
   */
  async createAudit(user: JWTPayload, input: CreateAuditInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const supplier = await this.getSupplier(input.supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    const auditNumber = await this.generateAuditNumber();

    const audit = await prisma.supplierAudit.create({
      data: {
        supplierId: input.supplierId,
        auditNumber,
        auditDate: new Date(input.auditDate),
        auditType: input.auditType,
        auditScore: input.auditScore,
        status: 'PLANNED',
      },
    });

    // Update supplier's last audit date and score
    await supplierRepository.updateSupplier(input.supplierId, {
      lastAuditDate: new Date(input.auditDate),
      lastAuditScore: input.auditScore,
    });

    return audit;
  }

  /**
   * Get supplier audits
   */
  async getAudits(supplierId: string, skip?: number, take?: number) {
    const supplier = await this.getSupplier(supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplierRepository.getAudits(supplierId, skip, take);
  }

  /**
   * Add audit finding (requires MANAGER or ADMIN)
   */
  async addAuditFinding(user: JWTPayload, input: AddAuditFindingInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const audit = await prisma.supplierAudit.findUnique({
      where: { id: input.auditId },
    });

    if (!audit) {
      throw new NotFoundError('Audit not found');
    }

    const finding = await supplierRepository.addAuditFinding(input.auditId, {
      severity: input.severity,
      description: input.description,
      evidence: input.evidence,
    });

    // If CRITICAL or HIGH finding, auto-create issue
    if (['CRITICAL', 'HIGH'].includes(input.severity)) {
      try {
        await supplierRepository.createIssue(audit.supplierId, {
          auditId: input.auditId,
          description: `Finding from audit ${audit.auditNumber}: ${input.description}`,
          severity: input.severity,
        });
      } catch (error) {
        // Non-breaking: log but don't fail the operation
        console.error('Failed to auto-create issue from finding:', error);
      }
    }

    return finding;
  }

  /**
   * Get audit findings
   */
  async getAuditFindings(auditId: string) {
    const audit = await prisma.supplierAudit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new NotFoundError('Audit not found');
    }

    return supplierRepository.getAuditFindings(auditId);
  }

  /**
   * Create supplier evaluation (requires MANAGER or ADMIN)
   */
  async createEvaluation(user: JWTPayload, input: CreateEvaluationInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const supplier = await this.getSupplier(input.supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    const evaluation = await supplierRepository.createEvaluation(input.supplierId, {
      evaluationDate: new Date(input.evaluationDate),
      qualityScore: input.qualityScore,
      deliveryScore: input.deliveryScore,
      priceScore: input.priceScore,
      notes: input.notes,
    });

    // Update supplier's overall rating based on evaluations
    const evaluations = await supplierRepository.getEvaluations(input.supplierId);
    const avgRating = evaluations.evaluations.reduce((sum, e) => sum + e.overallScore, 0) / (evaluations.evaluations.length || 1);

    await supplierRepository.updateSupplier(input.supplierId, {
      ratingScore: Math.min(5, avgRating / 20), // Convert 0-100 to 1-5 scale
    });

    return evaluation;
  }

  /**
   * Get supplier evaluations
   */
  async getEvaluations(supplierId: string, skip?: number, take?: number) {
    const supplier = await this.getSupplier(supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplierRepository.getEvaluations(supplierId, skip, take);
  }

  /**
   * Create supplier issue (requires MANAGER or ADMIN)
   */
  async createIssue(user: JWTPayload, input: CreateIssueInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const supplier = await this.getSupplier(input.supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    const issue = await supplierRepository.createIssue(input.supplierId, {
      auditId: input.auditId,
      description: input.description,
      severity: input.severity,
    });

    // Auto-create CAPA for CRITICAL or HIGH severity
    if (['CRITICAL', 'HIGH'].includes(input.severity)) {
      try {
        const userRecord = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true },
        });

        if (!userRecord) {
          return issue;
        }

        const nc = await prisma.nonConformance.create({
          data: {
            title: `NC from supplier issue: ${supplier.name}`,
            description: input.description,
            severity: input.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            status: 'OPEN',
            reportedById: user.userId,
          },
        });

        await prisma.correctiveAction.create({
          data: {
            action: `Address supplier issue from ${supplier.name}: ${input.description}`,
            nonConformanceId: nc.id,
            supplierIssueId: issue.id,
          },
        });
      } catch (error) {
        // Non-breaking: log but don't fail
        console.error('Failed to auto-create CAPA from issue:', error);
      }
    }

    return issue;
  }

  /**
   * Get supplier issues
   */
  async getIssues(supplierId: string, skip?: number, take?: number) {
    const supplier = await this.getSupplier(supplierId);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplierRepository.getIssues(supplierId, skip, take);
  }

  /**
   * Update issue status (requires MANAGER or ADMIN)
   */
  async updateIssueStatus(user: JWTPayload, input: UpdateIssueStatusInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const issue = await prisma.supplierIssue.findUnique({
      where: { id: input.issueId },
    });

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    return supplierRepository.updateIssueStatus(input.issueId, input.status);
  }

  /**
   * Link issue to CAPA (requires MANAGER or ADMIN)
   */
  async linkIssueToCapa(user: JWTPayload, input: LinkIssueToCapaInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const issue = await prisma.supplierIssue.findUnique({
      where: { id: input.issueId },
    });

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    const capa = await prisma.correctiveAction.findUnique({
      where: { id: input.capaId },
    });

    if (!capa) {
      throw new NotFoundError('CAPA not found');
    }

    return supplierRepository.linkIssueToCapa(input.issueId, input.capaId);
  }

  /**
   * Get top rated suppliers
   */
  async getTopSuppliers(limit?: number) {
    return supplierRepository.getTopSuppliers(limit || 10);
  }

  /**
   * Get low performing suppliers
   */
  async getLowPerformingSuppliers(complianceThreshold?: number, limit?: number) {
    return supplierRepository.getLowPerformingSuppliers(complianceThreshold || 50, limit || 10);
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStatistics() {
    return supplierRepository.getSupplierStatistics();
  }

  /**
   * Link supplier to risk (requires MANAGER or ADMIN)
   */
  async linkSupplierToRisk(user: JWTPayload, supplierId: string, riskId: string) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const supplier = await this.getSupplier(supplierId);
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
    });

    if (!risk) {
      throw new NotFoundError('Risk not found');
    }

    // Link supplier to risk through many-to-many relationship
    return prisma.risk.update({
      where: { id: riskId },
      data: {
        linkedSuppliers: {
          connect: { id: supplierId },
        },
      },
    });
  }
}

export const supplierService = new SupplierService();

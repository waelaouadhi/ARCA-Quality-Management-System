import prisma from '@/config/database';
import { JWTPayload, requireRole } from '@/shared/utils';
import { NotFoundError } from '@/shared/errors';
import { complaintRepository } from './complaint.repository';
import {
  CreateComplaintInput,
  UpdateComplaintInput,
  CreateInvestigationInput,
  AddAttachmentInput,
} from './complaint.validation';

export class ComplaintService {
  /**
   * Create complaint (MANAGER or ADMIN)
   * Auto-triggers: Risk assessment for CRITICAL/HIGH severity
   */
  async createComplaint(user: JWTPayload, input: CreateComplaintInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const complaint = await complaintRepository.createComplaint({
      ...input,
      reportedDate: new Date(input.reportedDate),
      severity: input.severity || 'MEDIUM',
    });

    // Auto-create risk for CRITICAL/HIGH complaints
    if (['CRITICAL', 'HIGH'].includes(input.severity || 'MEDIUM')) {
      try {
        const risk = await prisma.risk.create({
          data: {
            riskNumber: `RISK-AUTO-${complaint.id.substring(0, 8)}`,
            title: `Auto-triggered from complaint: ${input.title}`,
            description: input.description,
            riskType: 'operational',
            process: 'Complaint Management',
            status: 'IDENTIFIED',
            inherentProbability: input.severity === 'CRITICAL' ? 5 : 4,
            inherentImpact: input.severity === 'CRITICAL' ? 5 : 4,
            ownerId: user.userId,
            createdById: user.userId,
          },
        });

        await complaintRepository.update(complaint.id, {
          linkedRiskId: risk.id,
          riskAutoCreated: true,
        });
      } catch (error) {
        console.error('Failed to auto-create risk from complaint:', error);
      }
    }

    return complaint;
  }

  /**
   * Get complaint by ID
   */
  async getComplaint(id: string) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) throw new NotFoundError('Complaint not found');
    return complaint;
  }

  /**
   * Get all complaints
   */
  async getAllComplaints(skip?: number, take?: number) {
    return complaintRepository.findAll(skip, take);
  }

  /**
   * Update complaint (MANAGER or ADMIN)
   */
  async updateComplaint(user: JWTPayload, input: UpdateComplaintInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const complaint = await this.getComplaint(input.id);

    const updated = await complaintRepository.update(input.id, {
      ...(input.title && { title: input.title }),
      ...(input.status && { status: input.status }),
      ...(input.findings && { findings: input.findings }),
      ...(input.rootCause && { rootCause: input.rootCause }),
    });

    return updated;
  }

  /**
   * Start investigation (MANAGER or ADMIN)
   */
  async startInvestigation(user: JWTPayload, input: CreateInvestigationInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const complaint = await this.getComplaint(input.complaintId);

    const investigation = await complaintRepository.createInvestigation(
      input.complaintId,
      {
        methodology: input.methodology,
        immediateActions: input.immediateActions,
        investigator: user.userId,
      }
    );

    // Update complaint status to INVESTIGATING
    await complaintRepository.update(input.complaintId, {
      status: 'INVESTIGATING',
    });

    return investigation;
  }

  /**
   * Close investigation and auto-create CAPA for CRITICAL/HIGH
   */
  async closeInvestigation(user: JWTPayload, complaintId: string, findings: string) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const complaint = await this.getComplaint(complaintId);

    // Update investigation
    const investigation = await complaintRepository.getInvestigation(complaintId);
    if (investigation) {
      await prisma.complaintInvestigation.update({
        where: { id: investigation.id },
        data: { status: 'COMPLETED', endDate: new Date(), findings },
      });
    }

    // Auto-create CAPA for CRITICAL/HIGH severity
    if (['CRITICAL', 'HIGH'].includes(complaint.severity)) {
      try {
        const capa = await prisma.correctiveAction.create({
          data: {
            action: `Address complaint ${complaint.complaintNumber}: ${complaint.title}`,
            nonConformanceId: '', // Link to NC or use placeholder
            complaintId,
          },
        });

        await complaintRepository.update(complaintId, {
          capaAutoCreated: true,
        });
      } catch (error) {
        console.error('Failed to auto-create CAPA from complaint:', error);
      }
    }

    // Update status to RESOLVED
    await complaintRepository.update(complaintId, {
      status: 'RESOLVED',
      findings,
    });

    return await this.getComplaint(complaintId);
  }

  /**
   * Add attachment to complaint
   */
  async addAttachment(user: JWTPayload, input: AddAttachmentInput) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const complaint = await this.getComplaint(input.complaintId);

    return complaintRepository.addAttachment(input.complaintId, {
      ...input,
      uploadedBy: user.userId,
    });
  }

  /**
   * Get complaint attachments
   */
  async getAttachments(complaintId: string) {
    const complaint = await this.getComplaint(complaintId);
    return complaintRepository.getAttachments(complaintId);
  }

  /**
   * Get complaints by status
   */
  async getComplaintsByStatus(status: string, skip?: number, take?: number) {
    return complaintRepository.findByStatus(status, skip, take);
  }

  /**
   * Get complaints by severity
   */
  async getComplaintsBySeverity(severity: string, skip?: number, take?: number) {
    return complaintRepository.getComplaintsBySeverity(severity, skip, take);
  }

  /**
   * Get dashboard statistics
   */
  async getStatistics() {
    return complaintRepository.getStatistics();
  }

  /**
   * Link complaint to risk
   */
  async linkRisk(user: JWTPayload, complaintId: string, riskId: string) {
    requireRole(user, ['MANAGER', 'ADMIN']);

    const complaint = await this.getComplaint(complaintId);
    const risk = await prisma.risk.findUnique({ where: { id: riskId } });

    if (!risk) throw new NotFoundError('Risk not found');

    return complaintRepository.update(complaintId, {
      linkedRiskId: riskId,
    });
  }

  /**
   * Delete complaint (ADMIN only)
   */
  async deleteComplaint(user: JWTPayload, id: string) {
    requireRole(user, ['ADMIN']);

    const complaint = await this.getComplaint(id);

    return prisma.complaint.delete({ where: { id } });
  }
}

export const complaintService = new ComplaintService();

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import prisma from '@/config/database';
import { complaintService } from '@/modules/complaint';

const mockUser = { userId: 'test-user-123', role: 'MANAGER' } as any;
const mockAdmin = { userId: 'admin-user-123', role: 'ADMIN' } as any;

describe('Phase 4 Step 2: Complaint Module Tests', () => {
  let complaintId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Complaint CRUD', () => {
    it('should create complaint with auto-numbering', async () => {
      const result = await complaintService.createComplaint(mockUser, {
        title: 'Product Quality Issue',
        description: 'Customer reported defective product batch',
        category: 'Product Quality',
        source: 'Customer',
        severity: 'HIGH',
        reportedDate: new Date().toISOString(),
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
      });

      expect(result.complaintNumber).toMatch(/^CMPL-\d{4}-\d{5}$/);
      expect(result.severity).toBe('HIGH');
      complaintId = result.id;
    });

    it('should auto-create risk for HIGH severity', async () => {
      const complaint = await complaintService.getComplaint(complaintId);
      expect(complaint.riskAutoCreated).toBe(true);
      expect(complaint.linkedRiskId).toBeDefined();
    });

    it('should retrieve complaint by ID', async () => {
      const complaint = await complaintService.getComplaint(complaintId);
      expect(complaint?.complaintNumber).toMatch(/^CMPL-\d{4}-\d{5}$/);
    });

    it('should update complaint', async () => {
      const updated = await complaintService.updateComplaint(mockUser, {
        id: complaintId,
        status: 'IN_REVIEW',
        findings: 'Initial assessment completed',
      });

      expect(updated.status).toBe('IN_REVIEW');
    });

    it('should get all complaints', async () => {
      const result = await complaintService.getAllComplaints(0, 10);
      expect(result.complaints).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const result = await complaintService.getComplaintsByStatus('IN_REVIEW', 0, 10);
      expect(result.complaints.every((c) => c.status === 'IN_REVIEW')).toBe(true);
    });

    it('should filter by severity', async () => {
      const result = await complaintService.getComplaintsBySeverity('HIGH', 0, 10);
      expect(result.complaints.every((c) => c.severity === 'HIGH')).toBe(true);
    });
  });

  describe('Complaint Investigation', () => {
    it('should start investigation', async () => {
      const investigation = await complaintService.startInvestigation(mockUser, {
        complaintId,
        methodology: 'Root Cause Analysis (5 Why)',
        immediateActions: 'Stop using affected batch',
      });

      expect(investigation).toBeDefined();
      expect(investigation.status).toBe('IN_PROGRESS');
    });

    it('should close investigation and auto-create CAPA for HIGH severity', async () => {
      const result = await complaintService.closeInvestigation(
        mockUser,
        complaintId,
        'Supplier quality control process failed'
      );

      expect(result.status).toBe('RESOLVED');
      expect(result.capaAutoCreated).toBe(true);
    });
  });

  describe('Complaint Attachments', () => {
    it('should add attachment', async () => {
      const attachment = await complaintService.addAttachment(mockUser, {
        complaintId,
        filename: 'product_defect.pdf',
        fileUrl: 'https://example.com/defect.pdf',
        fileType: 'application/pdf',
        fileSize: 2048,
        description: 'Product defect documentation',
      });

      expect(attachment.filename).toBe('product_defect.pdf');
    });

    it('should get attachments', async () => {
      const attachments = await complaintService.getAttachments(complaintId);
      expect(attachments).toBeInstanceOf(Array);
    });
  });

  describe('Complaint Statistics', () => {
    it('should get statistics', async () => {
      const stats = await complaintService.getStatistics();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.critical).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Authorization', () => {
    it('should require MANAGER for create', async () => {
      const regularUser = { userId: 'user', role: 'USER' } as any;
      await expect(
        complaintService.createComplaint(regularUser, {
          title: 'Test',
          description: 'Test',
          category: 'Test',
          source: 'Test',
          reportedDate: new Date().toISOString(),
        })
      ).rejects.toThrow();
    });

    it('should require ADMIN for delete', async () => {
      const managerUser = { userId: 'user', role: 'MANAGER' } as any;
      await expect(complaintService.deleteComplaint(managerUser, complaintId)).rejects.toThrow();
    });
  });
});

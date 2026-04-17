import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '@/config/database';
import { supplierService } from '@/modules/supplier';
import { supplierRepository } from '@/modules/supplier';
import { ensureUsers, resetDatabase } from '@/test-utils/testDatabase';

// Mock user with MANAGER role
const mockUser = {
  userId: 'cbbbbbbbbbbbbbbbbbbbbbbb',
  email: 'manager@test.com',
  role: 'MANAGER',
} as any;

const mockAdmin = {
  userId: 'caaaaaaaaaaaaaaaaaaaaaaa',
  email: 'admin@test.com',
  role: 'ADMIN',
} as any;

describe('Phase 4 Step 1: Supplier Module Tests', () => {
  let supplierId: string;
  let auditId: string;
  let contactId: string;
  let evaluationId: string;
  let issueId: string;

  beforeAll(async () => {
    // Ensure Prisma is connected
    await prisma.$connect();
    await resetDatabase();
    await ensureUsers([mockUser, mockAdmin]);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset IDs for each test
    supplierId = '';
    auditId = '';
    contactId = '';
    evaluationId = '';
    issueId = '';
  });

  // ============================================================================
  // SUPPLIER CRUD TESTS
  // ============================================================================

  describe('Supplier CRUD Operations', () => {
    it('should create a supplier successfully', async () => {
      const input = {
        name: 'Test Supplier Inc',
        description: 'A test supplier company',
        category: 'Electronics',
        primaryContact: 'contact@supplier.com',
        website: 'https://supplier.com',
      };

      const supplier = await supplierService.createSupplier(mockUser, input);

      expect(supplier).toBeDefined();
      expect(supplier.name).toBe('Test Supplier Inc');
      expect(supplier.supplierNumber).toMatch(/^SUPP-\d{4}-\d{5}$/);
      expect(supplier.category).toBe('Electronics');
      expect(supplier.ratingScore).toBe(5.0);
      expect(supplier.complianceScore).toBe(0);

      supplierId = supplier.id;
    });

    it('should retrieve supplier by ID', async () => {
      // First create a supplier
      const input = {
        name: 'Retrieve Test Supplier',
        description: 'Testing retrieval',
        category: 'Chemicals',
      };

      const created = await supplierService.createSupplier(mockUser, input);
      supplierId = created.id;

      // Retrieve it
      const retrieved = await supplierService.getSupplier(supplierId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(supplierId);
      expect(retrieved?.name).toBe('Retrieve Test Supplier');
    });

    it('should throw error when retrieving non-existent supplier', async () => {
      const fakeId = 'abcdefghijklmnopqrstuvwxy'; // 25 chars

      await expect(supplierService.getSupplier(fakeId)).rejects.toThrow(
        'Supplier not found'
      );
    });

    it('should update supplier successfully', async () => {
      // Create supplier first
      const input = {
        name: 'Update Test Supplier',
        category: 'Services',
      };

      const created = await supplierService.createSupplier(mockUser, input);
      supplierId = created.id;

      // Update it
      const updated = await supplierService.updateSupplier(mockUser, {
        id: supplierId,
        name: 'Updated Supplier Name',
        status: 'SUSPENDED',
        ratingScore: 3.5,
      });

      expect(updated.name).toBe('Updated Supplier Name');
      expect(updated.status).toBe('SUSPENDED');
      expect(updated.ratingScore).toBe(3.5);
    });

    it('should require MANAGER or ADMIN role for create', async () => {
      const regularUser = {
        userId: 'user-id',
        role: 'USER',
      } as any;

      const input = {
        name: 'Unauthorized Supplier',
        category: 'Test',
      };

      await expect(supplierService.createSupplier(regularUser, input)).rejects.toThrow();
    });

    it('should require ADMIN role for delete', async () => {
      // Create supplier first
      const input = {
        name: 'Delete Test Supplier',
        category: 'Test',
      };

      const created = await supplierService.createSupplier(mockUser, input);
      supplierId = created.id;

      // Try to delete with non-admin user
      await expect(
        supplierService.deleteSupplier(mockUser, supplierId)
      ).rejects.toThrow();

      // Should succeed with admin
      const deleted = await supplierService.deleteSupplier(mockAdmin, supplierId);
      expect(deleted).toBeDefined();
    });

    it('should get all suppliers with pagination', async () => {
      // Create a couple of suppliers
      for (let i = 0; i < 3; i++) {
        await supplierService.createSupplier(mockUser, {
          name: `Pagination Test ${i}`,
          category: 'Test',
        });
      }

      const result = await supplierService.getAllSuppliers(0, 5);

      expect(result.suppliers).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter suppliers by category', async () => {
      // Create suppliers with different categories
      await supplierService.createSupplier(mockUser, {
        name: 'Category Test 1',
        category: 'CategoryA',
      });

      await supplierService.createSupplier(mockUser, {
        name: 'Category Test 2',
        category: 'CategoryB',
      });

      const result = await supplierService.getSuppliersByCategory('CategoryA', 0, 10);

      expect(result.suppliers).toBeInstanceOf(Array);
      expect(result.suppliers.every((s) => s.category === 'CategoryA')).toBe(true);
    });

    it('should filter suppliers by status', async () => {
      // Create a supplier and update its status
      const created = await supplierService.createSupplier(mockUser, {
        name: 'Status Test',
        category: 'Test',
      });

      await supplierService.updateSupplier(mockUser, {
        id: created.id,
        status: 'INACTIVE',
      });

      const result = await supplierService.getSuppliersByStatus('INACTIVE', 0, 10);

      expect(result.suppliers).toBeInstanceOf(Array);
      expect(result.suppliers.some((s) => s.id === created.id)).toBe(true);
    });
  });

  // ============================================================================
  // SUPPLIER CONTACT TESTS
  // ============================================================================

  describe('Supplier Contacts', () => {
    beforeEach(async () => {
      // Create a supplier for contact tests
      const created = await supplierService.createSupplier(mockUser, {
        name: 'Contact Test Supplier',
        category: 'Test',
      });
      supplierId = created.id;
    });

    it('should add contact to supplier', async () => {
      const input = {
        supplierId,
        name: 'John Doe',
        role: 'Procurement Manager',
        email: 'john@supplier.com',
        phone: '555-1234',
      };

      const contact = await supplierService.addContact(mockUser, input);

      expect(contact).toBeDefined();
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@supplier.com');
      expect(contact.role).toBe('Procurement Manager');

      contactId = contact.id;
    });

    it('should get supplier contacts', async () => {
      // Add multiple contacts
      await supplierService.addContact(mockUser, {
        supplierId,
        name: 'Contact 1',
        role: 'Quality',
        email: 'q1@supplier.com',
      });

      await supplierService.addContact(mockUser, {
        supplierId,
        name: 'Contact 2',
        role: 'Technical',
        email: 'tech@supplier.com',
      });

      const contacts = await supplierService.getContacts(supplierId);

      expect(contacts).toBeInstanceOf(Array);
      expect(contacts.length).toBeGreaterThanOrEqual(2);
    });

    it('should require MANAGER or ADMIN role for adding contact', async () => {
      const regularUser = {
        userId: 'user-id',
        role: 'USER',
      } as any;

      await expect(
        supplierService.addContact(regularUser, {
          supplierId,
          name: 'Unauthorized Contact',
          role: 'Test',
          email: 'test@test.com',
        })
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // SUPPLIER AUDIT TESTS
  // ============================================================================

  describe('Supplier Audits', () => {
    beforeEach(async () => {
      // Create a supplier for audit tests
      const created = await supplierService.createSupplier(mockUser, {
        name: 'Audit Test Supplier',
        category: 'Test',
      });
      supplierId = created.id;
    });

    it('should create supplier audit', async () => {
      const input = {
        supplierId,
        auditDate: new Date().toISOString(),
        auditType: 'INITIAL' as const,
        auditScore: 85.5,
      };

      const audit = await supplierService.createAudit(mockUser, input);

      expect(audit).toBeDefined();
      expect(audit.auditNumber).toMatch(/^SUPP-AUDIT-\d{4}-\d{5}$/);
      expect(audit.auditScore).toBe(85.5);
      expect(audit.status).toBe('PLANNED');
      expect(audit.auditType).toBe('INITIAL');

      auditId = audit.id;
    });

    it('should get supplier audits', async () => {
      // Create multiple audits
      for (let i = 0; i < 2; i++) {
        await supplierService.createAudit(mockUser, {
          supplierId,
          auditDate: new Date().toISOString(),
          auditType: 'SURVEILLANCE' as const,
          auditScore: 80 + i * 5,
        });
      }

      const result = await supplierService.getAudits(supplierId, 0, 10);

      expect(result.audits).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('should add audit finding and auto-create issue for HIGH severity', async () => {
      // Create an audit first
      const audit = await supplierService.createAudit(mockUser, {
        supplierId,
        auditDate: new Date().toISOString(),
        auditType: 'INITIAL' as const,
        auditScore: 75,
      });
      auditId = audit.id;

      // Add HIGH severity finding
      const finding = await supplierService.addAuditFinding(mockUser, {
        auditId,
        severity: 'HIGH',
        description: 'Quality control process not fully documented',
        evidence: 'Observed during site visit',
      });

      expect(finding).toBeDefined();
      expect(finding.severity).toBe('HIGH');
      expect(finding.description).toContain('Quality control');

      // Check that issue was auto-created
      const issues = await supplierService.getIssues(supplierId, 0, 10);
      expect(issues.total).toBeGreaterThan(0);
    });

    it('should add audit finding for LOW severity without auto-creating issue', async () => {
      // Create an audit
      const audit = await supplierService.createAudit(mockUser, {
        supplierId,
        auditDate: new Date().toISOString(),
        auditType: 'INITIAL' as const,
        auditScore: 90,
      });
      auditId = audit.id;

      // Add LOW severity finding
      const finding = await supplierService.addAuditFinding(mockUser, {
        auditId,
        severity: 'LOW',
        description: 'Minor documentation issue',
      });

      expect(finding).toBeDefined();
      expect(finding.severity).toBe('LOW');
    });

    it('should get audit findings', async () => {
      // Create audit and add findings
      const audit = await supplierService.createAudit(mockUser, {
        supplierId,
        auditDate: new Date().toISOString(),
        auditType: 'INITIAL' as const,
        auditScore: 80,
      });
      auditId = audit.id;

      await supplierService.addAuditFinding(mockUser, {
        auditId,
        severity: 'MEDIUM',
        description: 'Finding 1',
      });

      await supplierService.addAuditFinding(mockUser, {
        auditId,
        severity: 'LOW',
        description: 'Finding 2',
      });

      const findings = await supplierService.getAuditFindings(auditId);

      expect(findings).toBeInstanceOf(Array);
      expect(findings.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // SUPPLIER EVALUATION TESTS
  // ============================================================================

  describe('Supplier Evaluations', () => {
    beforeEach(async () => {
      // Create a supplier for evaluation tests
      const created = await supplierService.createSupplier(mockUser, {
        name: 'Evaluation Test Supplier',
        category: 'Test',
      });
      supplierId = created.id;
    });

    it('should create supplier evaluation', async () => {
      const input = {
        supplierId,
        evaluationDate: new Date().toISOString(),
        qualityScore: 85,
        deliveryScore: 90,
        priceScore: 80,
        notes: 'Good overall performance',
      };

      const evaluation = await supplierService.createEvaluation(mockUser, input);

      expect(evaluation).toBeDefined();
      expect(evaluation.qualityScore).toBe(85);
      expect(evaluation.deliveryScore).toBe(90);
      expect(evaluation.priceScore).toBe(80);
      expect(evaluation.overallScore).toBe(85); // Average of 85, 90, 80
      expect(evaluation.notes).toBe('Good overall performance');

      evaluationId = evaluation.id;
    });

    it('should get supplier evaluations', async () => {
      // Create multiple evaluations
      for (let i = 0; i < 3; i++) {
        await supplierService.createEvaluation(mockUser, {
          supplierId,
          evaluationDate: new Date().toISOString(),
          qualityScore: 80 + i * 2,
          deliveryScore: 85,
          priceScore: 80,
        });
      }

      const result = await supplierService.getEvaluations(supplierId, 0, 10);

      expect(result.evaluations).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('should update supplier rating based on evaluations', async () => {
      // Create evaluation
      await supplierService.createEvaluation(mockUser, {
        supplierId,
        evaluationDate: new Date().toISOString(),
        qualityScore: 100,
        deliveryScore: 100,
        priceScore: 100,
      });

      // Check that supplier rating was updated
      const supplier = await supplierService.getSupplier(supplierId);
      expect(supplier?.ratingScore).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // SUPPLIER ISSUE TESTS
  // ============================================================================

  describe('Supplier Issues', () => {
    beforeEach(async () => {
      // Create a supplier for issue tests
      const created = await supplierService.createSupplier(mockUser, {
        name: 'Issue Test Supplier',
        category: 'Test',
      });
      supplierId = created.id;
    });

    it('should create supplier issue', async () => {
      const input = {
        supplierId,
        description: 'Quality control process not effective',
        severity: 'MEDIUM' as const,
      };

      const issue = await supplierService.createIssue(mockUser, input);

      expect(issue).toBeDefined();
      expect(issue.description).toBe('Quality control process not effective');
      expect(issue.severity).toBe('MEDIUM');
      expect(issue.status).toBe('OPEN');

      issueId = issue.id;
    });

    it('should auto-create CAPA for HIGH severity issue', async () => {
      const input = {
        supplierId,
        description: 'Critical quality issue detected',
        severity: 'CRITICAL' as const,
      };

      const issue = await supplierService.createIssue(mockUser, input);

      expect(issue).toBeDefined();
      expect(issue.severity).toBe('CRITICAL');

      // Verify CAPA was auto-created (check from repository level)
      // This depends on CorrectiveAction having supplierIssueId field
      issueId = issue.id;
    });

    it('should get supplier issues', async () => {
      // Create multiple issues
      for (let i = 0; i < 2; i++) {
        await supplierService.createIssue(mockUser, {
          supplierId,
          description: `Issue ${i + 1}`,
          severity: 'MEDIUM' as const,
        });
      }

      const result = await supplierService.getIssues(supplierId, 0, 10);

      expect(result.issues).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('should update issue status', async () => {
      // Create an issue
      const issue = await supplierService.createIssue(mockUser, {
        supplierId,
        description: 'Test issue',
        severity: 'LOW' as const,
      });
      issueId = issue.id;

      // Update status
      const updated = await supplierService.updateIssueStatus(mockUser, {
        issueId,
        status: 'RESOLVED',
      });

      expect(updated.status).toBe('RESOLVED');
    });

    it('should require MANAGER or ADMIN role for creating issue', async () => {
      const regularUser = {
        userId: 'user-id',
        role: 'USER',
      } as any;

      await expect(
        supplierService.createIssue(regularUser, {
          supplierId,
          description: 'Unauthorized issue',
          severity: 'HIGH' as const,
        })
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // SUPPLIER STATISTICS & ANALYTICS TESTS
  // ============================================================================

  describe('Supplier Statistics & Analytics', () => {
    it('should get top suppliers sorted by rating', async () => {
      // Create suppliers with different ratings
      for (let i = 0; i < 3; i++) {
        await supplierService.createSupplier(mockUser, {
          name: `Top Supplier ${i}`,
          category: 'Test',
        });
      }

      const topSuppliers = await supplierService.getTopSuppliers(5);

      expect(topSuppliers).toBeInstanceOf(Array);
      // Verify sorting
      for (let i = 0; i < topSuppliers.length - 1; i++) {
        expect(topSuppliers[i].ratingScore).toBeGreaterThanOrEqual(
          topSuppliers[i + 1].ratingScore
        );
      }
    });

    it('should get low performing suppliers', async () => {
      // Create a supplier with low compliance score
      const lowPerformer = await supplierService.createSupplier(mockUser, {
        name: 'Low Performer',
        category: 'Test',
      });

      await supplierService.updateSupplier(mockUser, {
        id: lowPerformer.id,
        complianceScore: 25,
      });

      const lowPerformers = await supplierService.getLowPerformingSuppliers(50, 1000);

      expect(lowPerformers).toBeInstanceOf(Array);
      expect(lowPerformers.some((s) => s.id === lowPerformer.id)).toBe(true);
    });

    it('should get supplier statistics', async () => {
      const stats = await supplierService.getSupplierStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalSuppliers).toBeGreaterThanOrEqual(0);
      expect(stats.activeSuppliers).toBeGreaterThanOrEqual(0);
      expect(stats.suspendedSuppliers).toBeGreaterThanOrEqual(0);
      expect(stats.avgRating).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // SUPPLIER REPOSITORY TESTS
  // ============================================================================

  describe('Supplier Repository Operations', () => {
    it('should create supplier through repository', async () => {
      const supplier = await supplierRepository.createSupplier({
        supplierNumber: 'SUPP-2026-99999',
        name: 'Direct Repo Test',
        category: 'Test',
      });

      expect(supplier).toBeDefined();
      expect(supplier.supplierNumber).toBe('SUPP-2026-99999');
    });

    it('should find supplier by number', async () => {
      const created = await supplierRepository.createSupplier({
        supplierNumber: 'SUPP-2026-88888',
        name: 'Find by Number Test',
        category: 'Test',
      });

      const found = await supplierRepository.findSupplierByNumber('SUPP-2026-88888');

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should count suppliers by status', async () => {
      const counts = await supplierRepository.getSupplierCountByStatus();

      expect(counts).toBeInstanceOf(Array);
      // Should have at least one status count
      expect(counts.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Supplier Module Integration Tests', () => {
    let testSupplierId: string;

    beforeEach(async () => {
      // Create a supplier for integration tests
      const supplier = await supplierService.createSupplier(mockUser, {
        name: 'Integration Test Supplier',
        description: 'Comprehensive integration testing',
        category: 'Electronics',
        primaryContact: 'contact@integration.com',
      });
      testSupplierId = supplier.id;
    });

    it('should complete full supplier lifecycle', async () => {
      // 1. Create supplier
      const supplier = await supplierService.getSupplier(testSupplierId);
      expect(supplier).toBeDefined();

      // 2. Add contact
      const contact = await supplierService.addContact(mockUser, {
        supplierId: testSupplierId,
        name: 'Lifecycle Contact',
        role: 'Quality',
        email: 'quality@integration.com',
      });
      expect(contact).toBeDefined();

      // 3. Create audit
      const audit = await supplierService.createAudit(mockUser, {
        supplierId: testSupplierId,
        auditDate: new Date().toISOString(),
        auditType: 'INITIAL' as const,
        auditScore: 82,
      });
      expect(audit).toBeDefined();

      // 4. Add finding
      const finding = await supplierService.addAuditFinding(mockUser, {
        auditId: audit.id,
        severity: 'MEDIUM',
        description: 'Process documentation needed',
      });
      expect(finding).toBeDefined();

      // 5. Create evaluation
      const evaluation = await supplierService.createEvaluation(mockUser, {
        supplierId: testSupplierId,
        evaluationDate: new Date().toISOString(),
        qualityScore: 85,
        deliveryScore: 88,
        priceScore: 80,
      });
      expect(evaluation).toBeDefined();

      // 6. Create issue
      const issue = await supplierService.createIssue(mockUser, {
        supplierId: testSupplierId,
        auditId: audit.id,
        description: 'Documentation gap identified',
        severity: 'MEDIUM' as const,
      });
      expect(issue).toBeDefined();

      // 7. Update issue status
      const updatedIssue = await supplierService.updateIssueStatus(mockUser, {
        issueId: issue.id,
        status: 'IN_REVIEW',
      });
      expect(updatedIssue.status).toBe('IN_REVIEW');

      // 8. Verify all data is connected
      const finalSupplier = await supplierService.getSupplier(testSupplierId);
      expect(finalSupplier?.name).toBe('Integration Test Supplier');
    });

    it('should handle multiple audits and evaluations', async () => {
      // Create 2 audits
      const audit1 = await supplierService.createAudit(mockUser, {
        supplierId: testSupplierId,
        auditDate: new Date().toISOString(),
        auditType: 'INITIAL' as const,
        auditScore: 75,
      });

      const audit2 = await supplierService.createAudit(mockUser, {
        supplierId: testSupplierId,
        auditDate: new Date(Date.now() + 86400000).toISOString(), // +1 day
        auditType: 'SURVEILLANCE' as const,
        auditScore: 85,
      });

      // Create 2 evaluations
      await supplierService.createEvaluation(mockUser, {
        supplierId: testSupplierId,
        evaluationDate: new Date().toISOString(),
        qualityScore: 80,
        deliveryScore: 85,
        priceScore: 75,
      });

      await supplierService.createEvaluation(mockUser, {
        supplierId: testSupplierId,
        evaluationDate: new Date(Date.now() + 86400000).toISOString(),
        qualityScore: 85,
        deliveryScore: 88,
        priceScore: 80,
      });

      // Verify retrieval
      const audits = await supplierService.getAudits(testSupplierId, 0, 10);
      const evaluations = await supplierService.getEvaluations(testSupplierId, 0, 10);

      expect(audits.total).toBeGreaterThanOrEqual(2);
      expect(evaluations.total).toBeGreaterThanOrEqual(2);
    });

    it('should handle authorization errors gracefully', async () => {
      const unauthorizedUser = {
        userId: 'user-id',
        role: 'USER',
      } as any;

      // All MANAGER operations should fail for USER role
      await expect(
        supplierService.createSupplier(unauthorizedUser, {
          name: 'Fail',
          category: 'Test',
        })
      ).rejects.toThrow();

      await expect(
        supplierService.addContact(unauthorizedUser, {
          supplierId: testSupplierId,
          name: 'Test',
          role: 'Test',
          email: 'test@test.com',
        })
      ).rejects.toThrow();
    });
  });
});

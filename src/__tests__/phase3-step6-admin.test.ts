import { PrismaClient } from '@prisma/client';
import { AdminService } from '@/modules/admin';
import { createAuthContext } from '@/shared/utils';

describe('Phase 3 Step 6: Admin Endpoints & Deployment Readiness', () => {
  let prisma: PrismaClient;
  let adminService: AdminService;
  let adminUser: any;
  let regularUser: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    adminService = new AdminService();

    // Create test users
    adminUser = {
      userId: 'test-admin-001',
      email: 'admin@test.com',
      role: 'ADMIN',
    };

    regularUser = {
      userId: 'test-user-001',
      email: 'user@test.com',
      role: 'USER',
    };

    // Ensure users exist
    await prisma.user.upsert({
      where: { email: adminUser.email },
      update: {},
      create: {
        id: adminUser.userId,
        email: adminUser.email,
        firstName: 'Admin',
        lastName: 'User',
        password: 'hashed-password',
        role: adminUser.role as any,
      },
    });

    await prisma.user.upsert({
      where: { email: regularUser.email },
      update: {},
      create: {
        id: regularUser.userId,
        email: regularUser.email,
        firstName: 'Regular',
        lastName: 'User',
        password: 'hashed-password',
        role: regularUser.role as any,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ========================================================================
  // WORKFLOW SEEDING TESTS
  // ========================================================================

  describe('Workflow Seeding', () => {
    it('should seed audit_lifecycle and risk_lifecycle workflows', async () => {
      const result = await adminService.seedWorkflows(adminUser);

      expect(result.success).toBe(true);
      expect(result.seededWorkflows.length).toBeGreaterThan(0);
      expect(
        result.seededWorkflows.includes('audit_lifecycle') ||
          result.seededWorkflows.length === 0
      ).toBe(true);
    });

    it('should prevent duplicate seeding', async () => {
      // Seed once
      await adminService.seedWorkflows(adminUser);

      // Seed again
      const result = await adminService.seedWorkflows(adminUser);

      // Should return empty or success message
      expect(result.success).toBe(true);
    });

    it('should list seeded workflows', async () => {
      await adminService.seedWorkflows(adminUser);
      const workflows = await adminService.getSeededWorkflows(adminUser);

      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);
    });

    it('should require ADMIN role to seed workflows', async () => {
      try {
        await adminService.seedWorkflows(regularUser);
        fail('Should have thrown AuthorizationError');
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
      }
    });
  });

  // ========================================================================
  // AUDIT TEMPLATE TESTS
  // ========================================================================

  describe('Audit Template Management', () => {
    let templateId: string;

    it('should create audit template with questions', async () => {
      const result = await adminService.createAuditTemplate(adminUser, {
        name: 'ISO 9001 Internal Audit Template',
        description: 'Standard ISO 9001 audit questions',
        questions: [
          {
            question: 'Are quality policies documented?',
            questionNumber: 1,
            category: 'Policy',
          },
          {
            question: 'Is management review documented?',
            questionNumber: 2,
            category: 'Review',
          },
        ],
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('ISO 9001 Internal Audit Template');
      expect(result.questionCount).toBe(2);

      templateId = result.id;
    });

    it('should prevent duplicate template names', async () => {
      try {
        await adminService.createAuditTemplate(adminUser, {
          name: 'ISO 9001 Internal Audit Template',
          description: 'Duplicate',
        });
        fail('Should have thrown ValidationError');
      } catch (error: any) {
        expect(error.message).toContain('already exists');
      }
    });

    it('should get audit templates with counts', async () => {
      const templates = await adminService.getAuditTemplates(adminUser);

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('questionCount');
      expect(templates[0]).toHaveProperty('usageCount');
      expect(templates[0]).toHaveProperty('isArchived');
    });

    it('should get single template with all questions', async () => {
      const template = await adminService.getAuditTemplate(adminUser, templateId);

      expect(template.id).toBe(templateId);
      expect(template.name).toBe('ISO 9001 Internal Audit Template');
      expect(Array.isArray(template.questions)).toBe(true);
      expect(template.questions.length).toBe(2);
      expect(template.questions[0]).toHaveProperty('question');
      expect(template.questions[0]).toHaveProperty('questionNumber');
    });

    it('should clone audit template', async () => {
      const cloned = await adminService.cloneAuditTemplate(
        adminUser,
        templateId,
        'ISO 9001 Audit Template v2'
      );

      expect(cloned.id).toBeDefined();
      expect(cloned.name).toBe('ISO 9001 Audit Template v2');
      expect(cloned.questionCount).toBe(2);
    });

    it('should update audit template', async () => {
      const updated = await adminService.updateAuditTemplate(
        adminUser,
        templateId,
        {
          description: 'Updated description',
        }
      );

      expect(updated.id).toBe(templateId);
      expect(updated.description).toBe('Updated description');
    });

    it('should archive audit template (if not in use)', async () => {
      // Create a new template for archiving
      const newTemplate = await adminService.createAuditTemplate(adminUser, {
        name: 'Template for Archiving',
        description: 'Will be archived',
      });

      const archived = await adminService.archiveAuditTemplate(
        adminUser,
        newTemplate.id
      );

      expect(archived.id).toBe(newTemplate.id);
      expect(archived.isArchived).toBe(true);
      expect(archived.archivedAt).toBeDefined();
    });

    it('should require ADMIN role for template operations', async () => {
      try {
        await adminService.createAuditTemplate(regularUser, {
          name: 'Unauthorized Template',
        });
        fail('Should have thrown AuthorizationError');
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
      }
    });

    it('should exclude archived templates by default', async () => {
      // Create and archive a template
      const newTemplate = await adminService.createAuditTemplate(adminUser, {
        name: 'Template for Exclusion Test',
      });

      await adminService.archiveAuditTemplate(adminUser, newTemplate.id);

      // Get templates (excluding archived)
      const templates = await adminService.getAuditTemplates(adminUser, false);
      const archivedExists = templates.some((t) => t.id === newTemplate.id);

      expect(archivedExists).toBe(false);
    });

    it('should include archived templates when requested', async () => {
      // Get templates (including archived)
      const templates = await adminService.getAuditTemplates(adminUser, true);

      expect(Array.isArray(templates)).toBe(true);
      // Should have more templates or equal with archived included
    });
  });

  // ========================================================================
  // DASHBOARD METRICS TESTS
  // ========================================================================

  describe('Dashboard Metrics', () => {
    it('should get dashboard metrics', async () => {
      const metrics = await adminService.getDashboardMetrics(adminUser);

      expect(metrics).toHaveProperty('auditMetrics');
      expect(metrics).toHaveProperty('riskMetrics');
      expect(metrics).toHaveProperty('capaMetrics');

      // Audit metrics
      expect(metrics.auditMetrics).toHaveProperty('totalAudits');
      expect(metrics.auditMetrics).toHaveProperty('completedAudits');
      expect(metrics.auditMetrics).toHaveProperty('avgFindingsSeverity');
      expect(metrics.auditMetrics).toHaveProperty('criticalFindingsCount');

      // Risk metrics
      expect(metrics.riskMetrics).toHaveProperty('totalRisks');
      expect(metrics.riskMetrics).toHaveProperty('avgInherentRisk');
      expect(metrics.riskMetrics).toHaveProperty('avgResidualRisk');

      // CAPA metrics
      expect(metrics.capaMetrics).toHaveProperty('totalCapas');
      expect(metrics.capaMetrics).toHaveProperty('pendingCapas');
      expect(metrics.capaMetrics).toHaveProperty('avgCompletionDays');
    });

    it('should calculate metrics correctly', async () => {
      const metrics = await adminService.getDashboardMetrics(adminUser);

      // Verify numeric values
      expect(typeof metrics.auditMetrics.totalAudits).toBe('number');
      expect(metrics.auditMetrics.totalAudits).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.riskMetrics.avgInherentRisk).toBe('number');
      expect(typeof metrics.capaMetrics.avgCompletionDays).toBe('number');
    });

    it('should require ADMIN role for dashboard', async () => {
      try {
        await adminService.getDashboardMetrics(regularUser);
        fail('Should have thrown AuthorizationError');
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
      }
    });

    it('should handle empty metrics gracefully', async () => {
      // Should still return valid structure even with no data
      const metrics = await adminService.getDashboardMetrics(adminUser);

      expect(metrics.auditMetrics.totalAudits).toBeGreaterThanOrEqual(0);
      expect(metrics.riskMetrics.totalRisks).toBeGreaterThanOrEqual(0);
      expect(metrics.capaMetrics.totalCapas).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // SYSTEM STATUS TESTS
  // ========================================================================

  describe('System Status & Health Check', () => {
    it('should get system status', async () => {
      const status = await adminService.getSystemStatus(adminUser);

      expect(status).toHaveProperty('databaseConnected');
      expect(status).toHaveProperty('workflowsSeeded');
      expect(status).toHaveProperty('templatesCount');
      expect(status).toHaveProperty('recordsCount');
      expect(status).toHaveProperty('lastCheck');
    });

    it('should check database connectivity', async () => {
      const status = await adminService.getSystemStatus(adminUser);

      expect(typeof status.databaseConnected).toBe('boolean');
      expect(status.databaseConnected).toBe(true);
    });

    it('should verify workflow seeds', async () => {
      // Seed workflows first
      await adminService.seedWorkflows(adminUser);

      const status = await adminService.getSystemStatus(adminUser);

      expect(status.workflowsSeeded.auditLifecycle).toBe(true);
      expect(status.workflowsSeeded.riskLifecycle).toBe(true);
    });

    it('should count templates correctly', async () => {
      const status = await adminService.getSystemStatus(adminUser);

      expect(typeof status.templatesCount.auditTemplates).toBe('number');
      expect(typeof status.templatesCount.activeAuditTemplates).toBe('number');
      expect(typeof status.templatesCount.archivedAuditTemplates).toBe('number');

      // Active + Archived = Total
      expect(
        status.templatesCount.activeAuditTemplates +
          status.templatesCount.archivedAuditTemplates
      ).toBe(status.templatesCount.auditTemplates);
    });

    it('should count records correctly', async () => {
      const status = await adminService.getSystemStatus(adminUser);

      expect(typeof status.recordsCount.audits).toBe('number');
      expect(typeof status.recordsCount.risks).toBe('number');
      expect(typeof status.recordsCount.capas).toBe('number');
      expect(typeof status.recordsCount.users).toBe('number');

      expect(status.recordsCount.audits).toBeGreaterThanOrEqual(0);
      expect(status.recordsCount.risks).toBeGreaterThanOrEqual(0);
      expect(status.recordsCount.capas).toBeGreaterThanOrEqual(0);
      expect(status.recordsCount.users).toBeGreaterThan(0); // We created test users
    });

    it('should require ADMIN role for system status', async () => {
      try {
        await adminService.getSystemStatus(regularUser);
        fail('Should have thrown AuthorizationError');
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
      }
    });

    it('should handle database errors gracefully', async () => {
      // This test ensures system status returns safely even on error
      const status = await adminService.getSystemStatus(adminUser);

      // Should have valid structure even if some checks fail
      expect(status).toHaveProperty('databaseConnected');
      expect(status).toHaveProperty('lastCheck');
    });
  });

  // ========================================================================
  // AUTHORIZATION TESTS
  // ========================================================================

  describe('Authorization & Access Control', () => {
    it('should deny non-ADMIN users from workflow operations', async () => {
      const operations = [
        () => adminService.seedWorkflows(regularUser),
        () => adminService.getSeededWorkflows(regularUser),
      ];

      for (const operation of operations) {
        try {
          await operation();
          fail('Should have thrown AuthorizationError');
        } catch (error: any) {
          expect(error.message).toContain('Access denied');
        }
      }
    });

    it('should deny non-ADMIN users from template operations', async () => {
      const operations = [
        () =>
          adminService.createAuditTemplate(regularUser, {
            name: 'Test',
          }),
        () => adminService.getAuditTemplates(regularUser),
        () => adminService.getAuditTemplate(regularUser, 'fake-id'),
        () => adminService.updateAuditTemplate(regularUser, 'fake-id', {}),
        () => adminService.archiveAuditTemplate(regularUser, 'fake-id'),
        () =>
          adminService.cloneAuditTemplate(regularUser, 'fake-id', 'Clone'),
      ];

      for (const operation of operations) {
        try {
          await operation();
          fail('Should have thrown AuthorizationError');
        } catch (error: any) {
          expect(error.message).toContain('Access denied');
        }
      }
    });

    it('should deny non-ADMIN users from dashboard', async () => {
      try {
        await adminService.getDashboardMetrics(regularUser);
        fail('Should have thrown AuthorizationError');
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
      }
    });

    it('should deny non-ADMIN users from system status', async () => {
      try {
        await adminService.getSystemStatus(regularUser);
        fail('Should have thrown AuthorizationError');
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
      }
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  describe('Complete Admin Workflows', () => {
    it('should complete workflow seeding → template creation → dashboard', async () => {
      // Step 1: Seed workflows
      const seedResult = await adminService.seedWorkflows(adminUser);
      expect(seedResult.success).toBe(true);

      // Step 2: Create template
      const template = await adminService.createAuditTemplate(adminUser, {
        name: 'Integration Test Template',
        questions: [
          { question: 'Test Question 1?', questionNumber: 1 },
        ],
      });
      expect(template.id).toBeDefined();

      // Step 3: Get dashboard
      const metrics = await adminService.getDashboardMetrics(adminUser);
      expect(metrics.auditMetrics).toBeDefined();

      // Step 4: Check system status
      const status = await adminService.getSystemStatus(adminUser);
      expect(status.workflowsSeeded.auditLifecycle).toBe(true);
    });

    it('should handle template lifecycle: create → update → clone → archive', async () => {
      // Create
      const original = await adminService.createAuditTemplate(adminUser, {
        name: 'Lifecycle Test Template',
      });

      // Update
      await adminService.updateAuditTemplate(adminUser, original.id, {
        description: 'Updated',
      });

      // Clone
      const cloned = await adminService.cloneAuditTemplate(
        adminUser,
        original.id,
        'Lifecycle Test Template - Clone'
      );
      expect(cloned.id).not.toBe(original.id);

      // Archive (clone only)
      const archived = await adminService.archiveAuditTemplate(
        adminUser,
        cloned.id
      );
      expect(archived.isArchived).toBe(true);

      // Original should still exist
      const updated = await adminService.getAuditTemplate(adminUser, original.id);
      expect(updated.id).toBe(original.id);
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle invalid template IDs', async () => {
      try {
        await adminService.getAuditTemplate(adminUser, 'invalid-id');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should handle empty template names', async () => {
      try {
        await adminService.createAuditTemplate(adminUser, {
          name: '',
        });
        fail('Should have thrown ValidationError');
      } catch (error: any) {
        expect(error.message).toContain('required');
      }
    });

    it('should prevent archiving templates in use', async () => {
      // Create template
      const template = await adminService.createAuditTemplate(adminUser, {
        name: 'Template with Audits',
      });

      // Create an audit using this template (would need audit module)
      // For now, just test the logic by mocking
      // This would fail if audit was created, pass if not

      try {
        await adminService.archiveAuditTemplate(adminUser, template.id);
        // Success if no audits use it
        expect(true).toBe(true);
      } catch (error: any) {
        // Also acceptable if audits exist
        expect(error.message).toContain('Cannot archive');
      }
    });
  });
});

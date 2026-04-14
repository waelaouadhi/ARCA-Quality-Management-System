import prisma from '@/config/database';
import { AuditService } from '@/modules/audit/audit.service';
import { RiskService } from '@/modules/risk/risk.service';
import { JWTPayload } from '@/shared/utils';
import { ValidationError, NotFoundError } from '@/shared/errors';

describe('Phase 3: Audit & Risk Modules', () => {
  const adminUser: JWTPayload = {
    userId: 'admin-user-id-1234567890123456',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  const managerUser: JWTPayload = {
    userId: 'manager-user-id-1234567890123',
    email: 'manager@test.com',
    role: 'MANAGER',
  };

  const regularUser: JWTPayload = {
    userId: 'user-id-1234567890123456789',
    email: 'user@test.com',
    role: 'USER',
  };

  let auditService: AuditService;
  let riskService: RiskService;

  beforeAll(() => {
    auditService = new AuditService();
    riskService = new RiskService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Audit Module', () => {
    let auditId: string;

    it('creates audit with auto-numbering', async () => {
      const result = await auditService.createAudit(
        {
          title: 'ISO Compliance Audit',
          description: 'Annual audit for ISO 9001 compliance',
          auditType: 'internal',
          auditScope: 'All processes',
          auditDate: new Date().toISOString(),
          templateId: undefined,
          auditTeamIds: undefined,
        },
        adminUser
      );

      expect(result).toBeDefined();
      expect(result.auditNumber).toMatch(/^AUDIT-\d{4}-\d{5}$/);
      expect(result.title).toBe('ISO Compliance Audit');
      expect(result.status).toBe('SCHEDULED');
      expect(result.createdById).toBe(adminUser.userId);

      auditId = result.id;
    });

    it('retrieves audit by id', async () => {
      const audit = await auditService.getAuditById(auditId, adminUser);

      expect(audit).toBeDefined();
      expect(audit.id).toBe(auditId);
      expect(audit.title).toBe('ISO Compliance Audit');
    });

    it('lists audits with pagination', async () => {
      const result = await auditService.getAudits(
        { skip: 0, take: 10 } as any,
        {},
        adminUser
      );

      expect(result).toHaveProperty('audits');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.audits)).toBe(true);
    });

    it('creates audit finding', async () => {
      const finding = await auditService.createFinding(
        {
          auditId,
          description: 'Non-compliance: Records not properly labeled',
          severity: 'HIGH',
        },
        adminUser
      );

      expect(finding).toBeDefined();
      expect(finding.auditId).toBe(auditId);
      expect(finding.severity).toBe('HIGH');
      expect(finding.status).toMatch(/OPEN|OPEN|INVESTIGATION/);
    });

    it('gets audit findings', async () => {
      const findings = await auditService.getAuditFindings(auditId, adminUser);

      expect(Array.isArray(findings)).toBe(true);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].auditId).toBe(auditId);
    });

    it('creates audit template', async () => {
      const template = await auditService.createTemplate(
        {
          name: `Template-${Date.now()}`,
          description: 'ISO 9001 Audit Template',
          questions: [
            'Are records properly maintained?',
            'Are processes documented?',
          ],
        },
        adminUser
      );

      expect(template).toBeDefined();
      expect(template.name).toContain('Template-');
      expect(template.description).toBe('ISO 9001 Audit Template');
    });

    it('rejects audit creation for non-admin users', async () => {
      try {
        await auditService.createAudit(
          {
            title: 'Unauthorized Audit',
            auditType: 'external',
            auditScope: 'Test',
            auditDate: new Date().toISOString(),
          },
          regularUser
        );
        fail('Should have rejected');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });

    it('retrieves all audit templates', async () => {
      const templates = await auditService.getTemplates(adminUser);

      expect(Array.isArray(templates)).toBe(true);
    });

    it('updates audit status', async () => {
      const updated = await auditService.updateAudit(
        auditId,
        { status: 'IN_PROGRESS' },
        adminUser
      );

      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('updates audit finding status', async () => {
      const findings = await auditService.getAuditFindings(auditId, adminUser);
      const findingId = findings[0].id;

      const updated = await auditService.updateFinding(
        findingId,
        { status: 'UNDER_INVESTIGATION' },
        adminUser
      );

      expect(updated.status).toBe('UNDER_INVESTIGATION');
    });

    it('retrieves audit workflow status', async () => {
      const transitions = await auditService.getAuditAvailableTransitions(
        auditId,
        adminUser
      );

      expect(Array.isArray(transitions)).toBe(true);
    });
  });

  describe('Risk Module', () => {
    let riskId: string;

    it('creates risk with calculated inherent risk', async () => {
      const result = await riskService.createRisk(
        {
          title: 'Supply Chain Disruption',
          description: 'Risk of supplier unavailability',
          riskType: 'operational',
          process: 'Procurement',
          inherentProbability: 3,
          inherentImpact: 4,
          ownerId: undefined,
        },
        managerUser
      );

      expect(result).toBeDefined();
      expect(result.riskNumber).toMatch(/^RISK-\d{4}-\d{5}$/);
      expect(result.title).toBe('Supply Chain Disruption');
      expect(result.status).toBe('IDENTIFIED');
      expect(result.inherentRisk).toBe(12); // 3 * 4
      expect(result.createdById).toBe(managerUser.userId);

      riskId = result.id;
    });

    it('retrieves risk by id', async () => {
      const risk = await riskService.getRiskById(riskId, managerUser);

      expect(risk).toBeDefined();
      expect(risk.id).toBe(riskId);
      expect(risk.title).toBe('Supply Chain Disruption');
      expect(risk.inherentRisk).toBe(12);
    });

    it('lists risks with pagination and filters', async () => {
      const result = await riskService.getRisks(
        { skip: 0, take: 10 } as any,
        { status: 'IDENTIFIED' },
        managerUser
      );

      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.risks)).toBe(true);
    });

    it('creates risk control', async () => {
      const control = await riskService.createControl(
        {
          riskId,
          controlName: 'Multi-supplier strategy',
          controlType: 'preventive',
          description: 'Maintain relationships with multiple suppliers',
        },
        managerUser
      );

      expect(control).toBeDefined();
      expect(control.riskId).toBe(riskId);
      expect(control.controlType).toBe('preventive');
      expect(control.status).toBe('ACTIVE');
    });

    it('gets risk controls', async () => {
      const controls = await riskService.getControls(riskId, managerUser);

      expect(Array.isArray(controls)).toBe(true);
      expect(controls.length).toBeGreaterThan(0);
      expect(controls[0].riskId).toBe(riskId);
    });

    it('creates risk assessment with calculated residual risk', async () => {
      const assessment = await riskService.createAssessment(
        {
          riskId,
          probability: 2, // Reduced from 3
          impact: 3, // Reduced from 4
        },
        managerUser
      );

      expect(assessment).toBeDefined();
      expect(assessment.riskId).toBe(riskId);
      expect(assessment.probability).toBe(2);
      expect(assessment.impact).toBe(3);
      expect(assessment.overallRisk).toBe(6); // 2 * 3
    });

    it('gets risk assessments', async () => {
      const assessments = await riskService.getAssessments(riskId, managerUser);

      expect(Array.isArray(assessments)).toBe(true);
      expect(assessments.length).toBeGreaterThan(0);
    });

    it('updates risk with residual risk calculation', async () => {
      const updated = await riskService.updateRisk(
        riskId,
        {
          status: 'MITIGATED',
          residualProbability: 1,
          residualImpact: 2,
        },
        managerUser
      );

      expect(updated.status).toBe('MITIGATED');
      expect(updated.residualRisk).toBe(2); // 1 * 2
    });

    it('rejects risk creation for non-manager users', async () => {
      try {
        await riskService.createRisk(
          {
            title: 'Unauthorized Risk',
            riskType: 'compliance',
            process: 'Test',
            inherentProbability: 2,
            inherentImpact: 2,
          },
          regularUser
        );
        fail('Should have rejected');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });

    it('handles non-existent risk', async () => {
      try {
        await riskService.getRiskById(
          'invalid-risk-id-1234567890123',
          managerUser
        );
        fail('Should have thrown NotFoundError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('Risk Scoring', () => {
    it('calculates inherent risk correctly', async () => {
      const risk1 = await riskService.createRisk(
        {
          title: 'Test Risk 1',
          riskType: 'financial',
          process: 'Finance',
          inherentProbability: 5,
          inherentImpact: 5,
        },
        managerUser
      );

      expect(risk1.inherentRisk).toBe(25); // 5 * 5

      const risk2 = await riskService.createRisk(
        {
          title: 'Test Risk 2',
          riskType: 'financial',
          process: 'Finance',
          inherentProbability: 1,
          inherentImpact: 1,
        },
        managerUser
      );

      expect(risk2.inherentRisk).toBe(1); // 1 * 1
    });

    it('tracks residual risk reduction', async () => {
      const risk = await riskService.createRisk(
        {
          title: 'Risk with Controls',
          riskType: 'strategic',
          process: 'Strategy',
          inherentProbability: 4,
          inherentImpact: 4,
        },
        managerUser
      );

      expect(risk.inherentRisk).toBe(16); // 4 * 4
      expect(risk.residualRisk).toBeUndefined(); // Not set yet

      const updated = await riskService.updateRisk(
        risk.id,
        {
          residualProbability: 2,
          residualImpact: 2,
        },
        managerUser
      );

      expect(updated.residualRisk).toBe(4); // 2 * 2
      expect(updated.residualRisk).toBeLessThan(updated.inherentRisk!);
    });
  });

  describe('Authorization', () => {
    it('allows MANAGER to manage risks', async () => {
      const risk = await riskService.createRisk(
        {
          title: 'Manager Risk',
          riskType: 'compliance',
          process: 'Compliance',
          inherentProbability: 3,
          inherentImpact: 3,
        },
        managerUser
      );

      expect(risk.createdById).toBe(managerUser.userId);
    });

    it('allows ADMIN to manage audits', async () => {
      const audit = await auditService.createAudit(
        {
          title: 'Admin Audit',
          auditType: 'internal',
          auditScope: 'Test',
          auditDate: new Date().toISOString(),
        },
        adminUser
      );

      expect(audit.createdById).toBe(adminUser.userId);
    });

    it('allows authenticated users to view audits', async () => {
      const result = await auditService.getAudits(
        { skip: 0, take: 10 } as any,
        {},
        regularUser
      );

      expect(result.audits).toBeDefined();
    });

    it('allows authenticated users to view risks', async () => {
      const result = await riskService.getRisks(
        { skip: 0, take: 10 } as any,
        {},
        regularUser
      );

      expect(result.risks).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('rejects audit with invalid input', async () => {
      try {
        await auditService.createAudit(
          {
            title: '',
            auditType: 'invalid-type' as any,
            auditScope: '',
            auditDate: 'invalid-date',
          },
          adminUser
        );
        fail('Should have rejected');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('rejects risk with invalid probability/impact range', async () => {
      try {
        await riskService.createRisk(
          {
            title: 'Invalid Risk',
            riskType: 'operational',
            process: 'Test',
            inherentProbability: 10, // Out of range
            inherentImpact: 10,
          },
          managerUser
        );
        fail('Should have rejected');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('rejects risk with invalid control type', async () => {
      const risk = await riskService.createRisk(
        {
          title: 'Control Test Risk',
          riskType: 'operational',
          process: 'Test',
          inherentProbability: 2,
          inherentImpact: 2,
        },
        managerUser
      );

      try {
        await riskService.createControl(
          {
            riskId: risk.id,
            controlName: 'Bad Control',
            controlType: 'invalid-type' as any,
          },
          managerUser
        );
        fail('Should have rejected');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('Pagination', () => {
    it('respects pagination limits', async () => {
      // Create multiple risks
      for (let i = 0; i < 5; i++) {
        await riskService.createRisk(
          {
            title: `Risk ${i}`,
            riskType: 'operational',
            process: 'Test',
            inherentProbability: 2,
            inherentImpact: 2,
          },
          managerUser
        );
      }

      const page1 = await riskService.getRisks(
        { skip: 0, take: 3 } as any,
        {},
        managerUser
      );

      expect(page1.risks.length).toBeLessThanOrEqual(3);
      expect(page1.total).toBeGreaterThanOrEqual(5);
    });
  });
});

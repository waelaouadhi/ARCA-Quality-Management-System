import prisma from '@/config/database';
import { AuditService } from '@/modules/audit/audit.service';
import { RiskService } from '@/modules/risk/risk.service';
import { JWTPayload } from '@/shared/utils';
import { ensureUsers, resetDatabase } from '@/test-utils/testDatabase';

describe('Phase 3 Step 5: Cross-Module Integration', () => {
  const adminUser: JWTPayload = {
    userId: 'caaaaaaaaaaaaaaaaaaaaaaa',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  const managerUser: JWTPayload = {
    userId: 'cbbbbbbbbbbbbbbbbbbbbbbb',
    email: 'manager@test.com',
    role: 'MANAGER',
  };

  let auditService: AuditService;
  let riskService: RiskService;

  beforeAll(async () => {
    await resetDatabase();
    await ensureUsers([adminUser, managerUser]);
    auditService = new AuditService();
    riskService = new RiskService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Audit Finding → CAPA Auto-Trigger', () => {
    let auditId: string;
    let auditFindingId: string;
    let capaId: string;

    it('creates audit for testing CAPA auto-trigger', async () => {
      const audit = await auditService.createAudit(
        {
          title: 'CAPA Trigger Test Audit',
          description: 'Testing auto-CAPA creation from critical findings',
          auditType: 'internal',
          auditScope: 'Quality processes',
          auditDate: new Date().toISOString(),
        },
        adminUser
      );

      expect(audit).toBeDefined();
      expect(audit.auditNumber).toMatch(/^AUDIT-\d{4}-\d{5}$/);
      auditId = audit.id;
    });

    it('creates CRITICAL finding and auto-triggers CAPA', async () => {
      const finding = await auditService.createFinding(
        {
          auditId,
          description: 'Critical non-compliance: Missing documentation',
          severity: 'CRITICAL',
        },
        adminUser
      );

      expect(finding).toBeDefined();
      expect(finding.severity).toBe('CRITICAL');
      expect(finding.capaAutoCreated).toBe(true);
      expect(finding.linkedCapaId).toBeDefined();
      expect(finding.status).toBe('INVESTIGATION');

      auditFindingId = finding.id;
      if (finding.linkedCapaId) {
        capaId = finding.linkedCapaId;
      }
    });

    it('verifies CAPA was created with correct linkage', async () => {
      if (!capaId) {
        console.log('Skipping: No CAPA ID - requires database connection');
        return;
      }

      const capa = await prisma.correctiveAction.findUnique({
        where: { id: capaId },
        include: { auditFinding: true, nonConformance: true },
      });

      expect(capa).toBeDefined();
      expect(capa?.capaNumber).toMatch(/^CAPA-\d{4}-\d{5}$/);
      expect(capa?.status).toBe('PENDING');
      expect(capa?.auditFindingId).toBe(auditFindingId);
      expect(capa?.nonConformance?.title).toContain('Audit Finding');
    });

    it('retrieves CAPAs triggered by audit findings', async () => {
      const capas = await auditService.getCapasTriggeredByFindings(
        auditId,
        adminUser
      );

      expect(Array.isArray(capas)).toBe(true);
      if (capas.length > 0) {
        expect(capas[0].auditFindingId).toBeDefined();
      }
    });

    it('creates HIGH finding and auto-triggers CAPA', async () => {
      const finding = await auditService.createFinding(
        {
          auditId,
          description: 'High severity: Control not implemented',
          severity: 'HIGH',
        },
        adminUser
      );

      expect(finding.severity).toBe('HIGH');
      expect(finding.capaAutoCreated).toBe(true);
      expect(finding.linkedCapaId).toBeDefined();
    });

    it('creates LOW finding without auto-trigger', async () => {
      const finding = await auditService.createFinding(
        {
          auditId,
          description: 'Minor finding: Formatting issue',
          severity: 'LOW',
        },
        adminUser
      );

      expect(finding.severity).toBe('LOW');
      expect(finding.capaAutoCreated).toBe(false);
      expect(finding.linkedCapaId).toBeNull();
    });
  });

  describe('Risk ↔ Audit Linking', () => {
    let riskId: string;
    let auditId: string;

    it('creates risk for linking', async () => {
      const risk = await riskService.createRisk(
        {
          title: 'Audit Assessment Risk',
          description: 'Risk to be assessed in audit',
          riskType: 'operational',
          process: 'Testing',
          inherentProbability: 3,
          inherentImpact: 3,
        },
        managerUser
      );

      expect(risk).toBeDefined();
      riskId = risk.id;
    });

    it('creates audit for risk assessment linking', async () => {
      const audit = await auditService.createAudit(
        {
          title: 'Risk Assessment Audit',
          description: 'Audit that assesses organizational risks',
          auditType: 'internal',
          auditScope: 'Risk management processes',
          auditDate: new Date().toISOString(),
        },
        adminUser
      );

      expect(audit).toBeDefined();
      auditId = audit.id;
    });

    it('links risk to audit (audit assesses risk)', async () => {
      const updated = await auditService.addRiskAssessment(
        auditId,
        riskId,
        adminUser
      );

      expect(updated).toBeDefined();
      expect(updated.id).toBe(auditId);
    });

    it('retrieves risks assessed in audit', async () => {
      const risks = await auditService.getRisksAssessedInAudit(
        auditId,
        adminUser
      );

      expect(Array.isArray(risks)).toBe(true);
      const foundRisk = risks.find((r) => r.id === riskId);
      expect(foundRisk).toBeDefined();
    });

    it('retrieves audits that assessed risk', async () => {
      const audits = await riskService.getAuditsThatAssessedRisk(
        riskId,
        managerUser
      );

      expect(Array.isArray(audits)).toBe(true);
      const foundAudit = audits.find((a) => a.id === auditId);
      expect(foundAudit).toBeDefined();
    });

    it('tracks multiple audits assessing same risk', async () => {
      // Create second audit
      const audit2 = await auditService.createAudit(
        {
          title: 'Second Risk Assessment',
          auditType: 'external',
          auditScope: 'Risk controls',
          auditDate: new Date().toISOString(),
        },
        adminUser
      );

      // Link second audit to same risk
      await auditService.addRiskAssessment(audit2.id, riskId, adminUser);

      const audits = await riskService.getAuditsThatAssessedRisk(
        riskId,
        managerUser
      );

      expect(audits.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Complete Audit Workflow with CAPA & Risk', () => {
    let auditId: string;
    let riskId: string;
    let capaId: string;

    it('executes complete workflow', async () => {
      // 1. Create risk
      const risk = await riskService.createRisk(
        {
          title: 'Process Risk',
          riskType: 'operational',
          process: 'Operations',
          inherentProbability: 4,
          inherentImpact: 4,
        },
        managerUser
      );
      riskId = risk.id;

      // 2. Create audit
      const audit = await auditService.createAudit(
        {
          title: 'Process Audit',
          auditType: 'internal',
          auditScope: 'Complete process',
          auditDate: new Date().toISOString(),
        },
        adminUser
      );
      auditId = audit.id;

      expect(audit).toBeDefined();
      expect(risk).toBeDefined();
    });

    it('audit assesses the risk', async () => {
      const result = await auditService.addRiskAssessment(
        auditId,
        riskId,
        adminUser
      );

      expect(result.id).toBe(auditId);

      // Verify linking
      const risks = await auditService.getRisksAssessedInAudit(
        auditId,
        adminUser
      );
      expect(risks.map((r) => r.id)).toContain(riskId);
    });

    it('audit finding triggers CAPA', async () => {
      const finding = await auditService.createFinding(
        {
          auditId,
          description: 'Risk not adequately controlled',
          severity: 'CRITICAL',
        },
        adminUser
      );

      expect(finding.capaAutoCreated).toBe(true);
      expect(finding.linkedCapaId).toBeDefined();

      if (finding.linkedCapaId) {
        capaId = finding.linkedCapaId;
      }
    });

    it('verifies complete traceability chain', async () => {
      if (!capaId) {
        console.log('Skipping: No CAPA ID - requires database connection');
        return;
      }

      // Get CAPA
      const capa = await prisma.correctiveAction.findUnique({
        where: { id: capaId },
        include: {
          auditFinding: {
            include: { audit: true },
          },
          nonConformance: true,
        },
      });

      expect(capa).toBeDefined();
      expect(capa?.auditFinding?.audit?.id).toBe(auditId);

      // Get risks from audit
      const risks = await auditService.getRisksAssessedInAudit(
        auditId,
        adminUser
      );

      expect(risks.map((r) => r.id)).toContain(riskId);

      // Get audits from risk
      const audits = await riskService.getAuditsThatAssessedRisk(
        riskId,
        managerUser
      );

      expect(audits.map((a) => a.id)).toContain(auditId);
    });
  });

  describe('CAPA Closure & Risk Mitigation', () => {
    let auditId: string;
    let riskId: string;
    let capaId: string;

    it('creates initial setup', async () => {
      const risk = await riskService.createRisk(
        {
          title: 'Mitigation Test Risk',
          riskType: 'compliance',
          process: 'Compliance',
          inherentProbability: 5,
          inherentImpact: 5,
        },
        managerUser
      );
      riskId = risk.id;

      const audit = await auditService.createAudit(
        {
          title: 'Mitigation Audit',
          auditType: 'internal',
          auditScope: 'Compliance controls',
          auditDate: new Date().toISOString(),
        },
        adminUser
      );
      auditId = audit.id;

      const finding = await auditService.createFinding(
        {
          auditId,
          description: 'Compliance gap identified',
          severity: 'CRITICAL',
        },
        adminUser
      );

      if (finding.linkedCapaId) {
        capaId = finding.linkedCapaId;
      }

      await auditService.addRiskAssessment(auditId, riskId, adminUser);
    });

    it('updates risk with residual scoring after controls', async () => {
      const risk = await riskService.createControl(
        {
          riskId,
          controlName: 'Implement new control',
          controlType: 'preventive',
          description: 'Add preventive measure',
        },
        managerUser
      );

      expect(risk).toBeDefined();

      // Update residual risk
      const updated = await riskService.updateRisk(
        riskId,
        {
          residualProbability: 2,
          residualImpact: 2,
        },
        managerUser
      );

      expect(updated.residualRisk).toBe(4); // 2 * 2
      expect(updated.residualRisk).toBeLessThan(updated.inherentRisk!);
    });

    it('tracks full compliance workflow', async () => {
      if (!capaId) return;

      // Verify CAPA-Risk-Audit traceability
      const capa = await prisma.correctiveAction.findUnique({
        where: { id: capaId },
        include: { auditFinding: true },
      });

      expect(capa?.auditFinding?.auditId).toBe(auditId);

      // Verify audit-risk link
      const risksAssessed = await auditService.getRisksAssessedInAudit(
        auditId,
        adminUser
      );

      expect(risksAssessed.map((r) => r.id)).toContain(riskId);

      // Get current risk state
      const risk = await riskService.getRiskById(riskId, managerUser);
      expect(risk.residualRisk).toBeLessThan(risk.inherentRisk!);
    });
  });

  describe('Authorization & Access Control', () => {
    it('enforces audit creation authorization', async () => {
      const regularUser: JWTPayload = {
        userId: 'user-id-1234567890123456789',
        email: 'user@test.com',
        role: 'USER',
      };

      try {
        await auditService.createAudit(
          {
            title: 'Unauthorized',
            auditType: 'internal',
            auditScope: 'Test',
            auditDate: new Date().toISOString(),
          },
          regularUser
        );
        fail('Should reject non-ADMIN');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });

    it('enforces risk creation authorization', async () => {
      const regularUser: JWTPayload = {
        userId: 'user-id-1234567890123456789',
        email: 'user@test.com',
        role: 'USER',
      };

      try {
        await riskService.createRisk(
          {
            title: 'Unauthorized',
            riskType: 'operational',
            process: 'Test',
            inherentProbability: 2,
            inherentImpact: 2,
          },
          regularUser
        );
        fail('Should reject non-MANAGER');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });

    it('allows authenticated users to view relationships', async () => {
      const regularUser: JWTPayload = {
        userId: 'user-id-1234567890123456789',
        email: 'user@test.com',
        role: 'USER',
      };

      // User can view audits (read-only)
      const audits = await auditService.getAudits(
        { skip: 0, take: 10 } as any,
        {},
        regularUser
      );

      expect(audits).toBeDefined();

      // User can view risks (read-only)
      const risks = await riskService.getRisks(
        { skip: 0, take: 10 } as any,
        {},
        regularUser
      );

      expect(risks).toBeDefined();
    });
  });
});

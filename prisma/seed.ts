import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Reset all tables for deterministic seeding
  await prisma.notification.deleteMany();
  await prisma.escalationHistory.deleteMany();
  await prisma.correctiveActionEscalation.deleteMany();
  await prisma.nonConformanceEscalation.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.auditFinding.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.auditQuestion.deleteMany();
  await prisma.auditTemplate.deleteMany();
  await prisma.nonConformance.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.sLARule.deleteMany();
  await prisma.user.deleteMany();

  const password = await hashPassword('Qms@12345');
  const now = new Date();
  const hours = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);
  const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  // Users (7)
  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: 'olivia.chen@qms.com',
        password,
        firstName: 'Olivia',
        lastName: 'Chen',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'rahul.patel@qms.com',
        password,
        firstName: 'Rahul',
        lastName: 'Patel',
        role: 'MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria.garcia@qms.com',
        password,
        firstName: 'Maria',
        lastName: 'Garcia',
        role: 'MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.kim@qms.com',
        password,
        firstName: 'David',
        lastName: 'Kim',
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'fatima.hassan@qms.com',
        password,
        firstName: 'Fatima',
        lastName: 'Hassan',
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'lucas.martin@qms.com',
        password,
        firstName: 'Lucas',
        lastName: 'Martin',
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'nora.ibrahim@qms.com',
        password,
        firstName: 'Nora',
        lastName: 'Ibrahim',
        role: 'USER',
      },
    }),
  ]);
  console.log(`✅ Users seeded: ${users.length}`);

  // Audit Templates (2)
  const auditTemplates = await prisma.$transaction([
    prisma.auditTemplate.create({
      data: {
        name: 'Internal Process Compliance Template',
        description: 'Internal process compliance and documentation checks.',
      },
    }),
    prisma.auditTemplate.create({
      data: {
        name: 'Supplier Quality System Template',
        description: 'Supplier quality system and incoming controls review.',
      },
    }),
  ]);
  console.log(`✅ AuditTemplates seeded: ${auditTemplates.length}`);

  // Audit Questions (6)
  const auditQuestions = await prisma.$transaction([
    prisma.auditQuestion.create({
      data: {
        templateId: auditTemplates[0].id,
        questionNumber: 1,
        question: 'Are SOP revisions approved before effective date?',
        category: 'System',
      },
    }),
    prisma.auditQuestion.create({
      data: {
        templateId: auditTemplates[0].id,
        questionNumber: 2,
        question: 'Are training records updated for revised documents?',
        category: 'Process',
      },
    }),
    prisma.auditQuestion.create({
      data: {
        templateId: auditTemplates[0].id,
        questionNumber: 3,
        question: 'Are batch records complete and signed?',
        category: 'Product',
      },
    }),
    prisma.auditQuestion.create({
      data: {
        templateId: auditTemplates[1].id,
        questionNumber: 1,
        question: 'Does supplier maintain change control logs?',
        category: 'System',
      },
    }),
    prisma.auditQuestion.create({
      data: {
        templateId: auditTemplates[1].id,
        questionNumber: 2,
        question: 'Are incoming inspections performed to specification?',
        category: 'Process',
      },
    }),
    prisma.auditQuestion.create({
      data: {
        templateId: auditTemplates[1].id,
        questionNumber: 3,
        question: 'Are supplier CAPAs tracked to closure?',
        category: 'Product',
      },
    }),
  ]);
  console.log(`✅ AuditQuestions seeded: ${auditQuestions.length}`);

  // Audits (5)
  const audits = await prisma.$transaction([
    prisma.audit.create({
      data: {
        auditNumber: `AUDIT-${now.getFullYear()}-00001`,
        title: 'Q1 Internal QMS Process Audit',
        description: 'Quarterly internal audit for document control and production records.',
        auditType: 'internal',
        auditScope: 'Document control, batch records, training matrix',
        auditDate: days(-12),
        status: 'COMPLETED',
        templateId: auditTemplates[0].id,
        createdById: users[1].id,
        completedAt: days(-10),
      },
    }),
    prisma.audit.create({
      data: {
        auditNumber: `AUDIT-${now.getFullYear()}-00002`,
        title: 'Supplier PM-77 Qualification Audit',
        description: 'On-site supplier quality system verification.',
        auditType: 'supplier',
        auditScope: 'Incoming quality controls and traceability',
        auditDate: days(-4),
        status: 'IN_PROGRESS',
        templateId: auditTemplates[1].id,
        createdById: users[2].id,
      },
    }),
    prisma.audit.create({
      data: {
        auditNumber: `AUDIT-${now.getFullYear()}-00003`,
        title: 'External Certification Readiness Audit',
        description: 'Preparation audit for certification surveillance.',
        auditType: 'external',
        auditScope: 'CAPA effectiveness and management review evidence',
        auditDate: days(6),
        status: 'SCHEDULED',
        templateId: auditTemplates[0].id,
        createdById: users[0].id,
      },
    }),
    prisma.audit.create({
      data: {
        auditNumber: `AUDIT-${now.getFullYear()}-00004`,
        title: 'Packaging Line Process Audit',
        description: 'Focused internal audit on packaging controls.',
        auditType: 'internal',
        auditScope: 'Label controls, seal integrity, line clearance',
        auditDate: days(-20),
        status: 'CLOSED',
        templateId: auditTemplates[0].id,
        createdById: users[1].id,
        completedAt: days(-18),
      },
    }),
    prisma.audit.create({
      data: {
        auditNumber: `AUDIT-${now.getFullYear()}-00005`,
        title: 'Supplier Calibration Program Audit',
        description: 'Remote audit of supplier calibration and maintenance records.',
        auditType: 'supplier',
        auditScope: 'Calibration schedules, gauge R&R, preventive maintenance',
        auditDate: days(2),
        status: 'SCHEDULED',
        templateId: auditTemplates[1].id,
        createdById: users[2].id,
      },
    }),
  ]);
  console.log(`✅ Audits seeded: ${audits.length}`);

  // Audit Findings (6)
  const auditFindings = await prisma.$transaction([
    prisma.auditFinding.create({
      data: {
        auditId: audits[0].id,
        findingNumber: 1,
        description: 'Two SOP revisions were approved without training evidence.',
        severity: 'HIGH',
        category: 'Process',
        status: 'RESOLVED',
        resolvedAt: days(-9),
      },
    }),
    prisma.auditFinding.create({
      data: {
        auditId: audits[0].id,
        findingNumber: 2,
        description: 'One batch record missing verifier signature.',
        severity: 'MEDIUM',
        category: 'Product',
        status: 'CLOSED',
        resolvedAt: days(-8),
      },
    }),
    prisma.auditFinding.create({
      data: {
        auditId: audits[1].id,
        findingNumber: 1,
        description: 'Incoming inspection reports are incomplete for two recent lots.',
        severity: 'HIGH',
        category: 'Process',
        status: 'INVESTIGATION',
        dueDate: days(3),
      },
    }),
    prisma.auditFinding.create({
      data: {
        auditId: audits[1].id,
        findingNumber: 2,
        description: 'Supplier CAPA closure evidence not linked to root cause.',
        severity: 'CRITICAL',
        category: 'System',
        status: 'OPEN',
        dueDate: days(2),
      },
    }),
    prisma.auditFinding.create({
      data: {
        auditId: audits[3].id,
        findingNumber: 1,
        description: 'Label verification checklist not archived for one shift.',
        severity: 'LOW',
        category: 'Process',
        status: 'CLOSED',
        resolvedAt: days(-17),
      },
    }),
    prisma.auditFinding.create({
      data: {
        auditId: audits[3].id,
        findingNumber: 2,
        description: 'Seal pull-test log used outdated acceptance threshold.',
        severity: 'MEDIUM',
        category: 'Product',
        status: 'RESOLVED',
        resolvedAt: days(-16),
      },
    }),
  ]);
  console.log(`✅ AuditFindings seeded: ${auditFindings.length}`);

  // Documents (7)
  const documents = await prisma.$transaction([
    prisma.document.create({
      data: {
        title: 'QMS Quality Manual 2026',
        content: 'Defines quality policy, objectives, and governance for all manufacturing sites.',
        version: 5,
        status: 'APPROVED',
        createdById: users[0].id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'SOP-001 Incoming Material Inspection',
        content: 'Sampling, dimensional checks, and AQL acceptance criteria for inbound lots.',
        version: 3,
        status: 'APPROVED',
        createdById: users[1].id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'SOP-014 Device Label Control',
        content: 'Label artwork review and release workflow before packaging execution.',
        version: 2,
        status: 'REVIEW',
        createdById: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'WI-032 Torque Verification at Final Assembly',
        content: 'Tool calibration, torque range checks, and sign-off requirements.',
        version: 4,
        status: 'APPROVED',
        createdById: users[1].id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'WI-044 Sterile Barrier Packaging Setup',
        content: 'Line clearance and seal integrity checks for sterile barrier packaging.',
        version: 1,
        status: 'DRAFT',
        createdById: users[3].id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'FRM-009 NC Investigation Worksheet',
        content: 'Root cause analysis template with 5-Why and containment evidence section.',
        version: 6,
        status: 'APPROVED',
        createdById: users[4].id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'SOP-099 Legacy Supplier Qualification',
        content: 'Historical supplier qualification process replaced by SOP-111.',
        version: 7,
        status: 'ARCHIVED',
        createdById: users[0].id,
      },
    }),
  ]);
  console.log(`✅ Documents seeded: ${documents.length}`);

  // Non-Conformances (7)
  const nonConformances = await prisma.$transaction([
    prisma.nonConformance.create({
      data: {
        title: 'Incorrect UDI printed on batch MED-2401',
        description: 'Packaging line printed an outdated UDI template on 186 units.',
        severity: 'CRITICAL',
        status: 'OPEN',
        dueDate: days(1),
        reportedById: users[3].id,
      },
    }),
    prisma.nonConformance.create({
      data: {
        title: 'Final assembly torque records missing signatures',
        description: 'Shift C records for line 2 were saved without verifier signatures.',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: days(2),
        reportedById: users[4].id,
      },
    }),
    prisma.nonConformance.create({
      data: {
        title: 'Seal strength below specification on pouch line',
        description: 'Three consecutive samples failed minimum seal strength criteria.',
        severity: 'HIGH',
        status: 'OPEN',
        dueDate: days(1),
        reportedById: users[5].id,
      },
    }),
    prisma.nonConformance.create({
      data: {
        title: 'Supplier CoA mismatch for polymer lot PM-77',
        description: 'Certificate listed different melt-flow index than received material test.',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        dueDate: days(4),
        reportedById: users[6].id,
      },
    }),
    prisma.nonConformance.create({
      data: {
        title: 'Calibration overdue for pressure gauge PG-19',
        description: 'Gauge used in process validation was past due by 5 days.',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        dueDate: days(-1),
        reportedById: users[1].id,
      },
    }),
    prisma.nonConformance.create({
      data: {
        title: 'Transit carton crush damage from carrier route 8',
        description: 'Pallet corners collapsed in transit, no product breach observed.',
        severity: 'LOW',
        status: 'CLOSED',
        dueDate: days(-3),
        reportedById: users[2].id,
      },
    }),
    prisma.nonConformance.create({
      data: {
        title: 'Document revision not synced to training matrix',
        description: 'Operators were trained on SOP v2 while v3 was already effective.',
        severity: 'LOW',
        status: 'OPEN',
        dueDate: days(5),
        reportedById: users[3].id,
      },
    }),
  ]);
  console.log(`✅ NonConformances seeded: ${nonConformances.length}`);

  // Corrective Actions (7)
  const correctiveActions = await prisma.$transaction([
    prisma.correctiveAction.create({
      data: {
        action: 'Lock retired UDI templates and enforce barcode verification gate before print.',
        status: 'IN_PROGRESS',
        nonConformanceId: nonConformances[0].id,
        assignedToId: users[1].id,
        dueDate: days(1),
      },
    }),
    prisma.correctiveAction.create({
      data: {
        action: 'Implement mandatory e-signature validation in assembly record workflow.',
        status: 'IN_PROGRESS',
        nonConformanceId: nonConformances[1].id,
        assignedToId: users[2].id,
        dueDate: days(2),
      },
    }),
    prisma.correctiveAction.create({
      data: {
        action: 'Requalify heat sealer jaws and add hourly seal pull-test checks.',
        status: 'PENDING',
        nonConformanceId: nonConformances[2].id,
        assignedToId: users[1].id,
        dueDate: days(2),
      },
    }),
    prisma.correctiveAction.create({
      data: {
        action: 'Place supplier lot PM-77 on quality hold and perform incoming re-test protocol.',
        status: 'PENDING',
        nonConformanceId: nonConformances[3].id,
        assignedToId: users[4].id,
        dueDate: days(3),
      },
    }),
    prisma.correctiveAction.create({
      data: {
        action: 'Create automatic calibration reminders and weekly overdue dashboard.',
        status: 'DONE',
        nonConformanceId: nonConformances[4].id,
        assignedToId: users[0].id,
        dueDate: days(-1),
      },
    }),
    prisma.correctiveAction.create({
      data: {
        action: 'Revise carrier loading SOP and add corner reinforcement standard.',
        status: 'DONE',
        nonConformanceId: nonConformances[5].id,
        assignedToId: users[5].id,
        dueDate: days(-2),
      },
    }),
    prisma.correctiveAction.create({
      data: {
        action: 'Sync SOP release workflow with LMS training completion gate.',
        status: 'PENDING',
        nonConformanceId: nonConformances[6].id,
        assignedToId: users[6].id,
        dueDate: days(6),
      },
    }),
  ]);
  console.log(`✅ CorrectiveActions seeded: ${correctiveActions.length}`);

  // SLA Rules (7)
  const slaRules = await prisma.$transaction([
    prisma.sLARule.create({
      data: {
        name: 'CRITICAL-GLOBAL',
        description: 'Enterprise default for critical quality events.',
        severity: 'CRITICAL',
        level1DelayHours: 0,
        level2DelayHours: 1,
        level3DelayHours: 2,
      },
    }),
    prisma.sLARule.create({
      data: {
        name: 'HIGH-GLOBAL',
        description: 'Enterprise default for high severity events.',
        severity: 'HIGH',
        level1DelayHours: 1,
        level2DelayHours: 4,
        level3DelayHours: 8,
      },
    }),
    prisma.sLARule.create({
      data: {
        name: 'MEDIUM-GLOBAL',
        description: 'Enterprise default for medium severity events.',
        severity: 'MEDIUM',
        level1DelayHours: 4,
        level2DelayHours: 12,
        level3DelayHours: 24,
      },
    }),
    prisma.sLARule.create({
      data: {
        name: 'LOW-GLOBAL',
        description: 'Enterprise default for low severity events.',
        severity: 'LOW',
        level1DelayHours: 8,
        level2DelayHours: 24,
        level3DelayHours: 48,
      },
    }),
    prisma.sLARule.create({
      data: {
        name: 'HIGH-PACKAGING',
        description: 'Faster escalation for packaging line incidents.',
        severity: 'HIGH',
        departmentId: 'PKG',
        level1DelayHours: 0,
        level2DelayHours: 2,
        level3DelayHours: 6,
      },
    }),
    prisma.sLARule.create({
      data: {
        name: 'MEDIUM-SUPPLIER',
        description: 'Supplier quality escalation profile.',
        severity: 'MEDIUM',
        departmentId: 'SUP',
        level1DelayHours: 3,
        level2DelayHours: 10,
        level3DelayHours: 20,
      },
    }),
    prisma.sLARule.create({
      data: {
        name: 'LOW-DOC-CONTROL',
        description: 'Escalation profile for document control backlog.',
        severity: 'LOW',
        departmentId: 'DOC',
        level1DelayHours: 12,
        level2DelayHours: 36,
        level3DelayHours: 72,
      },
    }),
  ]);
  console.log(`✅ SLARules seeded: ${slaRules.length}`);

  // Non-Conformance Escalations (7)
  const ncEscalations = await prisma.$transaction([
    prisma.nonConformanceEscalation.create({
      data: {
        nonConformanceId: nonConformances[0].id,
        currentLevel: 'LEVEL_2',
        escalationStatus: 'ACTIVE',
        isOverdue: true,
        overdueAt: hours(-3),
        lastEscalatedAt: hours(-2),
        nextEscalationAt: hours(1),
        appliedSLARuleId: slaRules[0].id,
      },
    }),
    prisma.nonConformanceEscalation.create({
      data: {
        nonConformanceId: nonConformances[1].id,
        currentLevel: 'LEVEL_1',
        escalationStatus: 'ACTIVE',
        isOverdue: true,
        overdueAt: hours(-1),
        lastEscalatedAt: hours(-1),
        nextEscalationAt: hours(3),
        appliedSLARuleId: slaRules[1].id,
      },
    }),
    prisma.nonConformanceEscalation.create({
      data: {
        nonConformanceId: nonConformances[2].id,
        currentLevel: 'LEVEL_1',
        escalationStatus: 'ACTIVE',
        isOverdue: false,
        nextEscalationAt: hours(5),
        appliedSLARuleId: slaRules[4].id,
      },
    }),
    prisma.nonConformanceEscalation.create({
      data: {
        nonConformanceId: nonConformances[3].id,
        currentLevel: 'NONE',
        escalationStatus: 'NONE',
        isOverdue: false,
        appliedSLARuleId: slaRules[5].id,
      },
    }),
    prisma.nonConformanceEscalation.create({
      data: {
        nonConformanceId: nonConformances[4].id,
        currentLevel: 'NONE',
        escalationStatus: 'RESOLVED',
        isOverdue: false,
        appliedSLARuleId: slaRules[2].id,
      },
    }),
    prisma.nonConformanceEscalation.create({
      data: {
        nonConformanceId: nonConformances[5].id,
        currentLevel: 'NONE',
        escalationStatus: 'RESOLVED',
        isOverdue: false,
        appliedSLARuleId: slaRules[3].id,
      },
    }),
    prisma.nonConformanceEscalation.create({
      data: {
        nonConformanceId: nonConformances[6].id,
        currentLevel: 'LEVEL_1',
        escalationStatus: 'PAUSED',
        isOverdue: false,
        lastEscalatedAt: hours(-12),
        appliedSLARuleId: slaRules[6].id,
      },
    }),
  ]);
  console.log(`✅ NonConformanceEscalations seeded: ${ncEscalations.length}`);

  // Corrective Action Escalations (7)
  const caEscalations = await prisma.$transaction([
    prisma.correctiveActionEscalation.create({
      data: {
        correctiveActionId: correctiveActions[0].id,
        currentLevel: 'LEVEL_2',
        escalationStatus: 'ACTIVE',
        isOverdue: true,
        overdueAt: hours(-4),
        lastEscalatedAt: hours(-2),
        nextEscalationAt: hours(2),
        appliedSLARuleId: slaRules[0].id,
      },
    }),
    prisma.correctiveActionEscalation.create({
      data: {
        correctiveActionId: correctiveActions[1].id,
        currentLevel: 'LEVEL_1',
        escalationStatus: 'ACTIVE',
        isOverdue: true,
        overdueAt: hours(-2),
        lastEscalatedAt: hours(-1),
        nextEscalationAt: hours(3),
        appliedSLARuleId: slaRules[1].id,
      },
    }),
    prisma.correctiveActionEscalation.create({
      data: {
        correctiveActionId: correctiveActions[2].id,
        currentLevel: 'LEVEL_1',
        escalationStatus: 'ACTIVE',
        isOverdue: false,
        nextEscalationAt: hours(6),
        appliedSLARuleId: slaRules[4].id,
      },
    }),
    prisma.correctiveActionEscalation.create({
      data: {
        correctiveActionId: correctiveActions[3].id,
        currentLevel: 'NONE',
        escalationStatus: 'NONE',
        isOverdue: false,
        appliedSLARuleId: slaRules[5].id,
      },
    }),
    prisma.correctiveActionEscalation.create({
      data: {
        correctiveActionId: correctiveActions[4].id,
        currentLevel: 'NONE',
        escalationStatus: 'RESOLVED',
        isOverdue: false,
        appliedSLARuleId: slaRules[2].id,
      },
    }),
    prisma.correctiveActionEscalation.create({
      data: {
        correctiveActionId: correctiveActions[5].id,
        currentLevel: 'NONE',
        escalationStatus: 'RESOLVED',
        isOverdue: false,
        appliedSLARuleId: slaRules[3].id,
      },
    }),
    prisma.correctiveActionEscalation.create({
      data: {
        correctiveActionId: correctiveActions[6].id,
        currentLevel: 'LEVEL_1',
        escalationStatus: 'PAUSED',
        isOverdue: false,
        lastEscalatedAt: hours(-10),
        appliedSLARuleId: slaRules[6].id,
      },
    }),
  ]);
  console.log(`✅ CorrectiveActionEscalations seeded: ${caEscalations.length}`);

  // Audit Logs (7)
  const auditLogs = await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        action: 'CREATE_DOCUMENT',
        entity: 'Document',
        entityId: documents[0].id,
        userId: users[0].id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'APPROVE_DOCUMENT',
        entity: 'Document',
        entityId: documents[1].id,
        userId: users[1].id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'CREATE_NON_CONFORMANCE',
        entity: 'NonConformance',
        entityId: nonConformances[0].id,
        userId: users[3].id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'ASSIGN_CORRECTIVE_ACTION',
        entity: 'CorrectiveAction',
        entityId: correctiveActions[1].id,
        userId: users[2].id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'ESCALATION_LEVEL_CHANGED',
        entity: 'NonConformanceEscalation',
        entityId: ncEscalations[0].id,
        userId: users[0].id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'CLOSE_NON_CONFORMANCE',
        entity: 'NonConformance',
        entityId: nonConformances[5].id,
        userId: users[2].id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'RESOLVE_CORRECTIVE_ACTION',
        entity: 'CorrectiveAction',
        entityId: correctiveActions[5].id,
        userId: users[5].id,
      },
    }),
  ]);
  console.log(`✅ AuditLogs seeded: ${auditLogs.length}`);

  // Escalation History (7)
  const escHistory = await prisma.$transaction([
    prisma.escalationHistory.create({
      data: {
        ncEscalationId: ncEscalations[0].id,
        eventType: 'OVERDUE_DETECTED',
        escalationLevel: 'LEVEL_1',
        reason: 'Critical UDI issue exceeded immediate containment threshold.',
        triggeredBy: 'system',
      },
    }),
    prisma.escalationHistory.create({
      data: {
        ncEscalationId: ncEscalations[0].id,
        eventType: 'ESCALATED_TO_LEVEL_2',
        escalationLevel: 'LEVEL_2',
        reason: 'Containment evidence not completed within 2 hours.',
        triggeredBy: users[1].email,
      },
    }),
    prisma.escalationHistory.create({
      data: {
        caEscalationId: caEscalations[1].id,
        eventType: 'OVERDUE_DETECTED',
        escalationLevel: 'LEVEL_1',
        reason: 'Implementation task remains open past planned handoff.',
        triggeredBy: 'system',
      },
    }),
    prisma.escalationHistory.create({
      data: {
        caEscalationId: caEscalations[0].id,
        eventType: 'ESCALATED_TO_LEVEL_2',
        escalationLevel: 'LEVEL_2',
        reason: 'Manager review pending after first escalation alert.',
        triggeredBy: 'system',
      },
    }),
    prisma.escalationHistory.create({
      data: {
        ncEscalationId: ncEscalations[6].id,
        eventType: 'ESCALATION_PAUSED',
        escalationLevel: 'LEVEL_1',
        reason: 'Awaiting engineering trial completion before further escalation.',
        triggeredBy: users[2].email,
      },
    }),
    prisma.escalationHistory.create({
      data: {
        caEscalationId: caEscalations[4].id,
        eventType: 'ESCALATION_RESOLVED',
        escalationLevel: 'NONE',
        reason: 'Calibration reminder automation deployed and validated.',
        triggeredBy: users[0].email,
      },
    }),
    prisma.escalationHistory.create({
      data: {
        ncEscalationId: ncEscalations[5].id,
        eventType: 'ESCALATION_RESOLVED',
        escalationLevel: 'NONE',
        reason: 'Shipping SOP revision implemented and training closed.',
        triggeredBy: users[2].email,
      },
    }),
  ]);
  console.log(`✅ EscalationHistory seeded: ${escHistory.length}`);

  // Notifications (7)
  const notifications = await prisma.$transaction([
    prisma.notification.create({
      data: {
        entityType: 'NonConformance',
        entityId: nonConformances[0].id,
        escalationLevel: 'LEVEL_1',
        recipientEmail: users[1].email,
        recipientUserId: users[1].id,
        channels: ['EMAIL', 'IN_APP'],
        channelStatuses: JSON.stringify({ EMAIL: 'SENT', IN_APP: 'SENT' }),
        status: 'SENT',
        sentAt: hours(-3),
        idempotencyKey: `nc-${nonConformances[0].id}-l1-${users[1].id}`,
      },
    }),
    prisma.notification.create({
      data: {
        entityType: 'NonConformance',
        entityId: nonConformances[1].id,
        escalationLevel: 'LEVEL_1',
        recipientEmail: users[2].email,
        recipientUserId: users[2].id,
        channels: ['EMAIL'],
        channelStatuses: JSON.stringify({ EMAIL: 'SENT' }),
        status: 'SENT',
        sentAt: hours(-1),
        idempotencyKey: `nc-${nonConformances[1].id}-l1-${users[2].id}`,
      },
    }),
    prisma.notification.create({
      data: {
        entityType: 'CorrectiveAction',
        entityId: correctiveActions[0].id,
        escalationLevel: 'LEVEL_2',
        recipientEmail: users[0].email,
        recipientUserId: users[0].id,
        channels: ['IN_APP'],
        channelStatuses: JSON.stringify({ IN_APP: 'SENT' }),
        status: 'SENT',
        sentAt: hours(-2),
        idempotencyKey: `ca-${correctiveActions[0].id}-l2-${users[0].id}`,
      },
    }),
    prisma.notification.create({
      data: {
        entityType: 'CorrectiveAction',
        entityId: correctiveActions[2].id,
        escalationLevel: 'LEVEL_1',
        recipientEmail: users[1].email,
        recipientUserId: users[1].id,
        channels: ['EMAIL', 'SLACK'],
        channelStatuses: JSON.stringify({ EMAIL: 'SENT', SLACK: 'SENT' }),
        status: 'SENT',
        sentAt: hours(-1),
        idempotencyKey: `ca-${correctiveActions[2].id}-l1-${users[1].id}`,
      },
    }),
    prisma.notification.create({
      data: {
        entityType: 'NonConformance',
        entityId: nonConformances[6].id,
        escalationLevel: 'LEVEL_1',
        recipientEmail: users[2].email,
        recipientUserId: users[2].id,
        channels: ['IN_APP'],
        channelStatuses: JSON.stringify({ IN_APP: 'SENT' }),
        status: 'SENT',
        sentAt: hours(-10),
        idempotencyKey: `nc-${nonConformances[6].id}-l1-${users[2].id}`,
      },
    }),
    prisma.notification.create({
      data: {
        entityType: 'CorrectiveAction',
        entityId: correctiveActions[6].id,
        escalationLevel: 'LEVEL_1',
        recipientEmail: users[6].email,
        recipientUserId: users[6].id,
        channels: ['EMAIL'],
        channelStatuses: JSON.stringify({ EMAIL: 'FAILED' }),
        status: 'FAILED',
        retryCount: 2,
        maxRetries: 3,
        lastRetryAt: hours(-2),
        nextRetryAt: hours(1),
        failureReason: 'SMTP timeout from relay service',
        idempotencyKey: `ca-${correctiveActions[6].id}-l1-${users[6].id}`,
      },
    }),
    prisma.notification.create({
      data: {
        entityType: 'CorrectiveAction',
        entityId: correctiveActions[1].id,
        escalationLevel: 'LEVEL_1',
        recipientEmail: users[2].email,
        recipientUserId: users[2].id,
        channels: ['EMAIL', 'IN_APP'],
        channelStatuses: JSON.stringify({ EMAIL: 'SENT', IN_APP: 'SENT' }),
        status: 'SENT',
        sentAt: hours(-1),
        idempotencyKey: `ca-${correctiveActions[1].id}-l1-${users[2].id}`,
      },
    }),
  ]);
  console.log(`✅ Notifications seeded: ${notifications.length}`);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

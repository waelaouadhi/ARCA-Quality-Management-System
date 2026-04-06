import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Users
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@qms.com' },
    update: {
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
    create: {
      email: 'admin@qms.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const managerPassword = await hashPassword('manager123');
  const manager = await prisma.user.upsert({
    where: { email: 'manager@qms.com' },
    update: {
      firstName: 'Quality',
      lastName: 'Manager',
      role: 'MANAGER',
    },
    create: {
      email: 'manager@qms.com',
      password: managerPassword,
      firstName: 'Quality',
      lastName: 'Manager',
      role: 'MANAGER',
    },
  });

  const userPassword = await hashPassword('user123');
  const user = await prisma.user.upsert({
    where: { email: 'user@qms.com' },
    update: {
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
    },
    create: {
      email: 'user@qms.com',
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
    },
  });

  console.log('✅ Users ready:', admin.email, manager.email, user.email);

  // Reset business data for deterministic seeds
  await prisma.auditLog.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.nonConformance.deleteMany();
  await prisma.document.deleteMany();

  // Documents
  const documents = await prisma.$transaction([
    prisma.document.create({
      data: {
        title: 'QMS Policy Manual',
        content: 'Master policy describing quality objectives, scope, and responsibilities.',
        version: 3,
        status: 'APPROVED',
        createdById: admin.id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'SOP-001 Incoming Inspection',
        content: 'Procedure for receiving and inspecting incoming materials.',
        version: 2,
        status: 'REVIEW',
        createdById: manager.id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'SOP-002 Label Verification',
        content: 'Checklist and controls for label review before shipment.',
        version: 1,
        status: 'DRAFT',
        createdById: manager.id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'WI-010 Packaging Line Setup',
        content: 'Work instruction for setup verification and line clearance.',
        version: 4,
        status: 'ARCHIVED',
        createdById: admin.id,
      },
    }),
  ]);
  console.log(`✅ Documents seeded: ${documents.length}`);

  // Non-Conformances
  const nonConformances = await prisma.$transaction([
    prisma.nonConformance.create({
      data: {
        title: 'Label mismatch on batch A-104',
        description: 'Product labels showed outdated revision code on 120 units.',
        severity: 'HIGH',
        status: 'OPEN',
        reportedById: user.id,
      },
    }),
    prisma.nonConformance.create({
      data: {
        title: 'Missing torque verification record',
        description: 'Final assembly record incomplete for 8 assemblies in shift B.',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        reportedById: manager.id,
      },
    }),
    prisma.nonConformance.create({
      data: {
        title: 'Damaged packaging during transport',
        description: 'Outer cartons crushed for pallet P-77; product unaffected.',
        severity: 'LOW',
        status: 'RESOLVED',
        reportedById: user.id,
      },
    }),
  ]);
  console.log(`✅ NonConformances seeded: ${nonConformances.length}`);

  // Corrective Actions
  const now = new Date();
  const correctiveActions = await prisma.$transaction([
    prisma.correctiveAction.create({
      data: {
        action: 'Revise label release checklist and add final dual-sign review.',
        status: 'IN_PROGRESS',
        nonConformanceId: nonConformances[0].id,
        assignedToId: manager.id,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.correctiveAction.create({
      data: {
        action: 'Train assembly team on mandatory torque record completion.',
        status: 'PENDING',
        nonConformanceId: nonConformances[1].id,
        assignedToId: admin.id,
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.correctiveAction.create({
      data: {
        action: 'Update packaging handoff SOP and verify carrier handling notes.',
        status: 'DONE',
        nonConformanceId: nonConformances[2].id,
        assignedToId: manager.id,
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`✅ CorrectiveActions seeded: ${correctiveActions.length}`);

  // Audit Logs
  const auditLogs = await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        action: 'CREATE_DOCUMENT',
        entity: 'Document',
        entityId: documents[0].id,
        userId: admin.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'SUBMIT_DOCUMENT_REVIEW',
        entity: 'Document',
        entityId: documents[1].id,
        userId: manager.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'CREATE_NON_CONFORMANCE',
        entity: 'NonConformance',
        entityId: nonConformances[0].id,
        userId: user.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'ASSIGN_CORRECTIVE_ACTION',
        entity: 'CorrectiveAction',
        entityId: correctiveActions[0].id,
        userId: manager.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'COMPLETE_CORRECTIVE_ACTION',
        entity: 'CorrectiveAction',
        entityId: correctiveActions[2].id,
        userId: manager.id,
      },
    }),
  ]);
  console.log(`✅ AuditLogs seeded: ${auditLogs.length}`);

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

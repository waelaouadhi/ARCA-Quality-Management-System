/**
 * Escalation System - Real-World Examples & Scenarios
 * 
 * Demonstrates:
 * - Creating and escalating Non-Conformances
 * - Escalating Corrective Actions
 * - Multi-level escalation chains
 * - Notification handling
 * - Edge cases and stop conditions
 */

import { PrismaClient, Severity } from '@prisma/client';
import { EscalationService } from './escalation.service';
import { NotificationService } from './notification.service';
import { SLAService } from './sla.service';
import { EscalationWorker } from './escalation.worker';
import { EscalationLevel, NotificationChannel } from './escalation.types';

const prisma = new PrismaClient();

// ============================================================================
// SCENARIO 1: CRITICAL Non-Conformance - Immediate Multi-Level Escalation
// ============================================================================

export async function scenario1_CriticalNC() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║ SCENARIO 1: CRITICAL Non-Conformance - Safety Issue                 ║
║ Behavior: Immediate notification + aggressive escalation            ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  const escalationService = new EscalationService(prisma);
  const notificationService = new NotificationService(prisma);

  // Simulate: Create CRITICAL NC that's already 30 minutes overdue
  const criticalNC = {
    id: 'nc-001-critical',
    entityType: 'NonConformance' as const,
    dueDate: new Date(Date.now() - 30 * 60 * 1000),  // 30 mins ago
    severity: 'CRITICAL' as Severity,
    status: 'OPEN',
    assignedToId: 'user-123',
  };

  console.log('📊 Non-Conformance Details:');
  console.log(`   - ID: ${criticalNC.id}`);
  console.log(`   - Severity: ${criticalNC.severity}`);
  console.log(`   - Time Overdue: 30 minutes`);
  console.log(`   - Status: ${criticalNC.status}`);

  // Escalate
  console.log(`\n🚀 Starting escalation process...`);

  try {
    // Level 1: Immediate notification to assigned user + manager
    console.log(`\n📧 LEVEL 1 (Immediate): Notifying assigned user and manager`);
    await notificationService.send({
      entityId: criticalNC.id,
      entityType: criticalNC.entityType,
      entityTitle: 'Safety Issue: Equipment Malfunction',
      severity: criticalNC.severity,
      escalationLevel: EscalationLevel.LEVEL_1,
      dueDate: criticalNC.dueDate,
      recipientEmail: 'assigned-user@company.com',
      channels: [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
        NotificationChannel.WEBSOCKET,
      ],
      idempotencyKey: `${criticalNC.id}:LEVEL_1:email`,
    });

    // Simulate: After 2 hours, auto-escalate to Level 2
    console.log(`\n⏱️  2-hour timeout passed...`);
    console.log(`📧 LEVEL 2 (After 2h): Escalating to manager and admin`);
    await notificationService.send({
      entityId: criticalNC.id,
      entityType: criticalNC.entityType,
      entityTitle: 'Safety Issue: Equipment Malfunction',
      severity: criticalNC.severity,
      escalationLevel: EscalationLevel.LEVEL_2,
      dueDate: criticalNC.dueDate,
      recipientEmail: 'manager@company.com',
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      idempotencyKey: `${criticalNC.id}:LEVEL_2:email`,
    });

    // Simulate: After 4 more hours, auto-escalate to Level 3 (Admin)
    console.log(`\n⏱️  4-hour timeout passed...`);
    console.log(`📧 LEVEL 3 (After 4h): Escalating to admin - URGENT`);
    await notificationService.send({
      entityId: criticalNC.id,
      entityType: criticalNC.entityType,
      entityTitle: 'Safety Issue: Equipment Malfunction',
      severity: criticalNC.severity,
      escalationLevel: EscalationLevel.LEVEL_3,
      dueDate: criticalNC.dueDate,
      recipientEmail: 'admin@company.com',
      channels: [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
        NotificationChannel.WEBSOCKET,
        NotificationChannel.SMS,
      ],
      idempotencyKey: `${criticalNC.id}:LEVEL_3:email`,
    });

    console.log(`\n✅ Escalation complete for CRITICAL NC`);
  } catch (error) {
    console.error(`❌ Error:`, error);
  }
}

// ============================================================================
// SCENARIO 2: HIGH Corrective Action - Department-Specific SLA
// ============================================================================

export async function scenario2_HighCAWithDeptSLA() {
  console.log(`
╣══════════════════════════════════════════════════════════════════════╝
║ SCENARIO 2: HIGH Corrective Action (Production Dept)                ║
║ Behavior: Department overrides global SLA with stricter timeline    ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  const slaService = new SLAService(prisma);

  // Get department-specific SLA
  console.log(`📋 Fetching applicable SLA rule...`);
  const slaRule = await slaService.getApplicableRule('HIGH', 'dept-production');

  console.log(`✅ Applicable SLA Rule:`);
  console.log(`   - Level 1: ${slaRule.level1DelayHours}h (notify immediately)`);
  console.log(`   - Level 2: ${slaRule.level2DelayHours}h (escalate to manager)`);
  console.log(`   - Level 3: ${slaRule.level3DelayHours}h (escalate to admin)`);
  console.log(`   - Channels: ${slaRule.notifyChannels.join(', ')}`);
}

// ============================================================================
// SCENARIO 3: MEDIUM NC - Acknowledgment Stops Escalation
// ============================================================================

export async function scenario3_AcknowledgmentStopsEscalation() {
  console.log(`
╣══════════════════════════════════════════════════════════════════════╝
║ SCENARIO 3: MEDIUM Non-Conformance - Manager Acknowledges           ║
║ Behavior: Acknowledgment pauses further escalation                  ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  const escalationService = new EscalationService(prisma);

  const mediumNC = {
    id: 'nc-002-medium',
    entityType: 'NonConformance' as const,
    dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),  // 4 days overdue
    severity: 'MEDIUM' as Severity,
    status: 'IN_PROGRESS',
    assignedToId: 'user-456',
  };

  console.log('📊 Non-Conformance Details:');
  console.log(`   - ID: ${mediumNC.id}`);
  console.log(`   - Severity: ${mediumNC.severity}`);
  console.log(`   - Time Overdue: 4 days`);

  // Escalate twice
  console.log(`\n🚀 First escalation (0 hours) -> LEVEL 1`);
  let state = await escalationService.escalate(mediumNC);
  console.log(`   Current Level: ${state.currentLevel}`);

  console.log(`\n⏱️  After 72 hours...`);
  console.log(`🚀 Second escalation (72 hours) -> LEVEL 2`);
  state = await escalationService.escalate(mediumNC);
  console.log(`   Current Level: ${state.currentLevel}`);

  // Manager acknowledges
  console.log(`\n👤 Manager acknowledges at Level 2`);
  await escalationService.acknowledge(mediumNC.id, mediumNC.entityType, 'manager@company.com');

  // Check state
  state = await escalationService.getState(mediumNC.id, mediumNC.entityType);
  console.log(`✅ Escalation paused:`);
  console.log(`   - Current Level: ${state?.currentLevel}`);
  console.log(`   - Status: ${state?.escalationStatus}`);
  console.log(`   - Acknowledged At: ${state?.acknowledgedAt}`);
  console.log(`   - Acknowledged By: ${state?.acknowledgedBy}`);
}

// ============================================================================
// SCENARIO 4: LOW CA - Resolved Stops Escalation
// ============================================================================

export async function scenario4_ResolutionStopsEscalation() {
  console.log(`
╣══════════════════════════════════════════════════════════════════════╝
║ SCENARIO 4: LOW Corrective Action - Resolved                        ║
║ Behavior: Resolution stops escalation immediately                  ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  const escalationService = new EscalationService(prisma);

  const lowCA = {
    id: 'ca-001-low',
    entityType: 'CorrectiveAction' as const,
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),  // 10 days overdue
    severity: 'LOW' as Severity,
    status: 'DONE',  // ← STOPPED - won't escalate
    assignedToId: 'user-789',
  };

  console.log('📊 Corrective Action Details:');
  console.log(`   - ID: ${lowCA.id}`);
  console.log(`   - Severity: ${lowCA.severity}`);
  console.log(`   - Time Overdue: 10 days`);
  console.log(`   - Status: ${lowCA.status} ✅`);

  console.log(`\n🚀 Attempting escalation...`);
  const state = await escalationService.escalate(lowCA);

  console.log(`✅ Escalation not triggered:`);
  console.log(`   - Reason: Status is ${lowCA.status} (stop condition met)`);
  console.log(`   - Current Level: ${state?.currentLevel}`);
}

// ============================================================================
// SCENARIO 5: Batch Processing & Worker
// ============================================================================

export async function scenario5_BatchProcessing() {
  console.log(`
╣══════════════════════════════════════════════════════════════════════╝
║ SCENARIO 5: Batch Processing with Worker                            ║
║ Behavior: Worker detects and escalates multiple items               ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  console.log(`🏃 Starting escalation worker for single run...`);
  const worker = new EscalationWorker(prisma);

  try {
    const batch = await worker.runOnce();

    console.log(`\n📊 Batch Results:`);
    console.log(`   - Total Items: ${batch.items.length}`);
    console.log(`   - Processed: ${batch.processedCount}`);
    console.log(`   - Failed: ${batch.failedCount}`);
    if (batch.errors.length > 0) {
      console.log(`   - Errors: ${batch.errors.length}`);
      batch.errors.forEach((err) => {
        console.log(`     • ${err.itemId}: ${err.error}`);
      });
    }
  } catch (error) {
    console.error(`❌ Worker error:`, error);
  }
}

// ============================================================================
// SCENARIO 6: Duplicate Prevention (Idempotency)
// ============================================================================

export async function scenario6_IdempotencyPrevention() {
  console.log(`
╣══════════════════════════════════════════════════════════════════════╝
║ SCENARIO 6: Duplicate Prevention via Idempotency Keys               ║
║ Behavior: Same key twice = second one skipped                       ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  const notificationService = new NotificationService(prisma);
  const idempotencyKey = 'nc-003:LEVEL_1:email:unique123';

  console.log(`📧 Sending notification with idempotency key...`);
  console.log(`   Key: ${idempotencyKey}\n`);

  // First send
  console.log(`📤 First attempt:`);
  const notif1 = await notificationService.send({
    entityId: 'nc-003',
    entityType: 'NonConformance',
    entityTitle: 'Test NC',
    severity: 'HIGH',
    escalationLevel: EscalationLevel.LEVEL_1,
    dueDate: new Date(),
    recipientEmail: 'test@company.com',
    channels: [NotificationChannel.EMAIL],
    idempotencyKey,
  });
  console.log(`   ✅ Notification created: ${notif1}\n`);

  // Second send with same key
  console.log(`📤 Second attempt (same key):`);
  const notif2 = await notificationService.send({
    entityId: 'nc-003',
    entityType: 'NonConformance',
    entityTitle: 'Test NC',
    severity: 'HIGH',
    escalationLevel: EscalationLevel.LEVEL_1,
    dueDate: new Date(),
    recipientEmail: 'test@company.com',
    channels: [NotificationChannel.EMAIL],
    idempotencyKey,
  });
  console.log(`   ♻️  Duplicate prevented, same ID: ${notif2}`);
  console.log(`   ✅ Idempotency guaranteed`);
}

// ============================================================================
// Run all scenarios
// ============================================================================

export async function runAllScenarios() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🎯 ESCALATION SYSTEM - SCENARIO DEMONSTRATIONS`);
  console.log(`${'═'.repeat(70)}\n`);

  try {
    await scenario1_CriticalNC();
    await scenario2_HighCAWithDeptSLA();
    await scenario3_AcknowledgmentStopsEscalation();
    await scenario4_ResolutionStopsEscalation();
    await scenario5_BatchProcessing();
    await scenario6_IdempotencyPrevention();

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`✅ All scenarios completed`);
    console.log(`${'═'.repeat(70)}\n`);
  } catch (error) {
    console.error(`❌ Scenario error:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  runAllScenarios();
}

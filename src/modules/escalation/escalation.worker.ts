/**
 * Escalation Worker
 * 
 * Background job for batch escalation processing
 * Runs on schedule (cron) or via queue (BullMQ)
 * 
 * Responsibilities:
 * - Detect overdue items
 * - Evaluate SLA rules
 * - Trigger escalations
 * - Send notifications
 * - Retry failed notifications
 * - Record audit events
 */

import { PrismaClient } from '@prisma/client';
import { EscalationService } from './escalation.service';
import { NotificationService } from './notification.service';
import { SLAService } from './sla.service';
import {
  IEscalationWorker,
  EscalationBatch,
  NotificationPayload,
  EscalationLevel,
} from './escalation.types';

export class EscalationWorker implements IEscalationWorker {
  private escalationService: EscalationService;
  private notificationService: NotificationService;
  private slaService: SLAService;
  private isRunning = false;
  private interval?: NodeJS.Timer;

  constructor(private prisma: PrismaClient) {
    this.escalationService = new EscalationService(prisma);
    this.notificationService = new NotificationService(prisma);
    this.slaService = new SLAService(prisma);
  }

  /**
   * Run escalation check once
   * Called by cron job or manual trigger
   */
  async runOnce(): Promise<EscalationBatch> {
    console.log(`\n⏰ Starting escalation check at ${new Date().toISOString()}`);

    const batch: EscalationBatch = {
      items: [],
      timestamp: new Date(),
      processedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Step 1: Detect overdue items
      const overdueItems = await this.escalationService.detectOverdueItems();
      batch.items = overdueItems as any;

      console.log(`📋 Detected ${overdueItems.length} overdue items`);

      if (overdueItems.length === 0) {
        console.log(`✅ No overdue items found`);
        return batch;
      }

      // Step 2: Process each overdue item
      for (const item of overdueItems) {
        try {
          // Escalate if needed
          const state = await this.escalationService.escalate({
            entityId: item.id,
            entityType: item.type,
            dueDate: item.dueDate,
            severity: item.severity,
            status: item.status,
            assignedToId: item.assignedToId,
          });

          // Get applicable SLA rule
          const slaRule = await this.slaService.getApplicableRule(item.severity);

          // Get recipients for current escalation level
          const recipients = this.slaService.getRecipientsForLevel(
            slaRule,
            state.currentLevel
          );

          console.log(
            `📤 Preparing notifications for ${item.id} at level ${state.currentLevel}`
          );

          // Step 3: Send notifications
          for (const recipient of recipients) {
            try {
              const payload: NotificationPayload = {
                entityId: item.id,
                entityType: item.type,
                entityTitle: item.title,
                severity: item.severity,
                escalationLevel: state.currentLevel as EscalationLevel,
                dueDate: item.dueDate,
                recipientEmail: recipient,
                channels: slaRule.notifyChannels as any,
                idempotencyKey: NotificationService.generateIdempotencyKey(
                  item.id,
                  state.currentLevel,
                  recipient
                ),
              };

              const notificationId = await this.notificationService.send(payload);
              console.log(`✉️  Sent notification ${notificationId}`);

              batch.processedCount++;
            } catch (notifError) {
              console.error(`❌ Failed to send notification for ${item.id}:`, notifError);
              batch.failedCount++;
              batch.errors.push({
                itemId: item.id,
                error: String(notifError),
              });
            }
          }
        } catch (itemError) {
          console.error(`❌ Failed to process item ${item.id}:`, itemError);
          batch.failedCount++;
          batch.errors.push({
            itemId: item.id,
            error: String(itemError),
          });
        }
      }

      // Step 4: Retry failed notifications
      await this.retryFailedNotifications();

      console.log(`
📊 Escalation batch complete:
   - Processed: ${batch.processedCount}
   - Failed: ${batch.failedCount}
   - Total items: ${batch.items.length}
      `);
    } catch (error) {
      console.error(`❌ Escalation worker error:`, error);
      batch.failedCount++;
      batch.errors.push({
        itemId: 'BATCH',
        error: String(error),
      });
    }

    return batch;
  }

  /**
   * Start continuous processing (for cron-based execution)
   * Note: For production, use external cron (node-cron) or queue service (BullMQ)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️  Worker already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Escalation worker started`);

    // Run every 5 minutes
    this.interval = setInterval(async () => {
      try {
        await this.runOnce();
      } catch (error) {
        console.error('❌ Worker error:', error);
      }
    }, 5 * 60 * 1000);

    // Run immediately on start
    await this.runOnce();
  }

  /**
   * Stop worker
   */
  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.isRunning = false;
    console.log(`⛔ Escalation worker stopped`);
  }

  /**
   * Private: Retry failed notifications
   */
  private async retryFailedNotifications(): Promise<void> {
    const now = new Date();

    // Find notifications that need retry
    const failedNotifications = await this.prisma.notification.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        nextRetryAt: { lte: now },
        retryCount: { lt: 3 },
      },
      take: 100,  // Batch size
    });

    if (failedNotifications.length === 0) {
      return;
    }

    console.log(`🔄 Retrying ${failedNotifications.length} failed notifications`);

    for (const notif of failedNotifications) {
      try {
        await this.notificationService.retry(notif.id);
      } catch (error) {
        console.error(`❌ Retry failed for notification ${notif.id}:`, error);
      }
    }
  }
}

/**
 * Export helper for common worker patterns
 */
export async function setupEscalationWorker(
  prisma: PrismaClient,
  options: {
    autoStart?: boolean;
    cronSchedule?: string;  // e.g., "*/5 * * * *" for every 5 minutes
  } = {}
): Promise<EscalationWorker> {
  const worker = new EscalationWorker(prisma);

  if (options.autoStart) {
    await worker.start();
  }

  return worker;
}

/**
 * BullMQ Queue Example (for production environments)
 * 
 * Install: npm install bullmq
 * 
 * Usage:
 * import { Queue, Worker as BullWorker } from 'bullmq';
 * 
 * const escalationQueue = new Queue('escalation', {
 *   connection: {
 *     host: 'localhost',
 *     port: 6379,
 *   },
 * });
 * 
 * // Add job to queue
 * await escalationQueue.add('process', {}, {
 *   repeat: {
 *     pattern: '*/5 * * * *',  // Every 5 minutes
 *   },
 * });
 * 
 * // Process jobs
 * const bullWorker = new BullWorker('escalation', async (job) => {
 *   const escalationWorker = new EscalationWorker(prisma);
 *   return await escalationWorker.runOnce();
 * }, {
 *   connection: {
 *     host: 'localhost',
 *     port: 6379,
 *   },
 * });
 */

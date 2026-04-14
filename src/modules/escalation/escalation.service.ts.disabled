/**
 * Core Escalation Service
 * 
 * Responsibilities:
 * - Detect overdue items
 * - Manage escalation state
 * - Trigger escalation events
 * - Handle stop conditions (closed, resolved, acknowledged)
 */

import { PrismaClient, Severity } from '@prisma/client';
import {
  IEscalationService,
  EscalationContext,
  EscalationState,
  OverdueItem,
  EscalationLevel,
  EscalationStatus,
} from './escalation.types';
import { SLAService } from './sla.service';

export class EscalationService implements IEscalationService {
  private slaService: SLAService;

  constructor(private prisma: PrismaClient) {
    this.slaService = new SLAService(prisma);
  }

  /**
   * Detect all items that are overdue
   * Batch query with efficient indexing
   */
  async detectOverdueItems(): Promise<OverdueItem[]> {
    const now = new Date();

    // Query overdue NonConformances
    const ncs = await this.prisma.nonConformance.findMany({
      where: {
        status: { not: 'CLOSED' },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        title: true,
        severity: true,
        dueDate: true,
      },
    });

    // Query overdue CorrectiveActions
    const cas = await this.prisma.correctiveAction.findMany({
      where: {
        status: { not: 'DONE' },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        action: true,
        assignedToId: true,
        dueDate: true,
        nonConformance: {
          select: { severity: true },
        },
      },
    });

    // Map results
    const overdueItems: OverdueItem[] = [
      ...ncs.map((nc) => ({
        id: nc.id,
        type: 'NonConformance' as const,
        dueDate: nc.dueDate!,
        severity: nc.severity,
        title: nc.title,
        status: 'OPEN',
        hoursOverdue: this.calculateHoursOverdue(nc.dueDate!, now),
      })),
      ...cas.map((ca) => ({
        id: ca.id,
        type: 'CorrectiveAction' as const,
        dueDate: ca.dueDate!,
        severity: ca.nonConformance.severity,
        title: ca.action,
        assignedToId: ca.assignedToId || undefined,
        status: 'PENDING',
        hoursOverdue: this.calculateHoursOverdue(ca.dueDate!, now),
      })),
    ];

    return overdueItems;
  }

  /**
   * Escalate a single item to next level
   */
  async escalate(context: EscalationContext): Promise<EscalationState> {
    // Check stop conditions
    if (this.shouldStop(context)) {
      console.log(`⏸️  Escalation stopped for ${context.entityId}: item is ${context.status}`);
      return this.getState(context.entityId, context.entityType) as any;
    }

    // Get or create escalation state
    let escalationState = await this.getOrCreateEscalationState(context);

    // Get applicable SLA rule
    const slaRule = await this.slaService.getApplicableRule(
      context.severity,
      context.departmentId
    );

    // Check if should escalate
    if (!this.slaService.shouldEscalate(escalationState, slaRule)) {
      console.log(`⏸️  Not yet time to escalate ${context.entityId}`);
      return escalationState;
    }

    // Calculate next level
    const nextLevel = this.slaService.getNextLevel(escalationState.currentLevel);
    const nextEscalationTime = this.slaService.getNextEscalationTime(
      { ...escalationState, currentLevel: nextLevel },
      slaRule
    );

    // Update state
    escalationState = await this.updateEscalationState(context.entityId, context.entityType, {
      currentLevel: nextLevel,
      escalationStatus: EscalationStatus.ACTIVE,
      lastEscalatedAt: new Date(),
      nextEscalationAt: nextEscalationTime,
      [`level${nextLevel.split('_')[1]}NotifiedAt`]: new Date(),
    });

    // Record event
    await this.recordEscalationEvent(
      context.entityId,
      context.entityType,
      `ESCALATED_TO_${nextLevel}`,
      nextLevel
    );

    console.log(
      `🚀 Escalated ${context.entityId} to ${nextLevel}`
    );

    return escalationState;
  }

  /**
   * Acknowledge escalation (stops further escalation)
   */
  async acknowledge(
    entityId: string,
    entityType: string,
    acknowledgedBy: string
  ): Promise<void> {
    const idKey = entityType === 'NonConformance' ? 'ncEscalationId' : 'caEscalationId';

    await this.prisma.escalationHistory.create({
      data: {
        eventType: 'ACKNOWLEDGED',
        escalationLevel: EscalationLevel.NONE,
        triggeredBy: acknowledgedBy,
        [idKey]: entityId,
      },
    });

    // Update escalation state
    if (entityType === 'NonConformance') {
      await this.prisma.nonConformanceEscalation.updateMany({
        where: { nonConformanceId: entityId },
        data: {
          escalationStatus: EscalationStatus.PAUSED,
          acknowledgedAt: new Date(),
          acknowledgedBy,
        },
      });
    } else {
      await this.prisma.correctiveActionEscalation.updateMany({
        where: { correctiveActionId: entityId },
        data: {
          escalationStatus: EscalationStatus.PAUSED,
          acknowledgedAt: new Date(),
          acknowledgedBy,
        },
      });
    }

    console.log(`✅ Escalation acknowledged for ${entityId} by ${acknowledgedBy}`);
  }

  /**
   * Pause escalation temporarily
   */
  async pauseEscalation(entityId: string, entityType: string): Promise<void> {
    if (entityType === 'NonConformance') {
      await this.prisma.nonConformanceEscalation.updateMany({
        where: { nonConformanceId: entityId },
        data: { escalationStatus: EscalationStatus.PAUSED },
      });
    } else {
      await this.prisma.correctiveActionEscalation.updateMany({
        where: { correctiveActionId: entityId },
        data: { escalationStatus: EscalationStatus.PAUSED },
      });
    }
  }

  /**
   * Resume escalation
   */
  async resumeEscalation(entityId: string, entityType: string): Promise<void> {
    if (entityType === 'NonConformance') {
      await this.prisma.nonConformanceEscalation.updateMany({
        where: { nonConformanceId: entityId },
        data: { escalationStatus: EscalationStatus.ACTIVE },
      });
    } else {
      await this.prisma.correctiveActionEscalation.updateMany({
        where: { correctiveActionId: entityId },
        data: { escalationStatus: EscalationStatus.ACTIVE },
      });
    }
  }

  /**
   * Get current escalation state
   */
  async getState(
    entityId: string,
    entityType: string
  ): Promise<EscalationState | null> {
    if (entityType === 'NonConformance') {
      const state = await this.prisma.nonConformanceEscalation.findUnique({
        where: { nonConformanceId: entityId },
      });
      return state ? this.mapToEscalationState(state) : null;
    } else {
      const state = await this.prisma.correctiveActionEscalation.findUnique({
        where: { correctiveActionId: entityId },
      });
      return state ? this.mapToEscalationState(state) : null;
    }
  }

  /**
   * Private: Get or create escalation state
   */
  private async getOrCreateEscalationState(
    context: EscalationContext
  ): Promise<EscalationState> {
    if (context.entityType === 'NonConformance') {
      let state = await this.prisma.nonConformanceEscalation.findUnique({
        where: { nonConformanceId: context.entityId },
      });

      if (!state) {
        state = await this.prisma.nonConformanceEscalation.create({
          data: {
            nonConformanceId: context.entityId,
            isOverdue: true,
            overdueAt: new Date(),
          },
        });
      }

      return this.mapToEscalationState(state);
    } else {
      let state = await this.prisma.correctiveActionEscalation.findUnique({
        where: { correctiveActionId: context.entityId },
      });

      if (!state) {
        state = await this.prisma.correctiveActionEscalation.create({
          data: {
            correctiveActionId: context.entityId,
            isOverdue: true,
            overdueAt: new Date(),
          },
        });
      }

      return this.mapToEscalationState(state);
    }
  }

  /**
   * Private: Update escalation state
   */
  private async updateEscalationState(
    entityId: string,
    entityType: string,
    data: any
  ): Promise<EscalationState> {
    if (entityType === 'NonConformance') {
      const state = await this.prisma.nonConformanceEscalation.update({
        where: { nonConformanceId: entityId },
        data,
      });
      return this.mapToEscalationState(state);
    } else {
      const state = await this.prisma.correctiveActionEscalation.update({
        where: { correctiveActionId: entityId },
        data,
      });
      return this.mapToEscalationState(state);
    }
  }

  /**
   * Private: Record escalation event for audit
   */
  private async recordEscalationEvent(
    entityId: string,
    entityType: string,
    eventType: string,
    escalationLevel: EscalationLevel
  ): Promise<void> {
    const idKey = entityType === 'NonConformance' ? 'ncEscalationId' : 'caEscalationId';

    if (entityType === 'NonConformance') {
      const state = await this.prisma.nonConformanceEscalation.findUnique({
        where: { nonConformanceId: entityId },
      });

      if (state) {
        await this.prisma.escalationHistory.create({
          data: {
            eventType,
            escalationLevel,
            triggeredBy: 'system',
            ncEscalationId: state.id,
          },
        });
      }
    } else {
      const state = await this.prisma.correctiveActionEscalation.findUnique({
        where: { correctiveActionId: entityId },
      });

      if (state) {
        await this.prisma.escalationHistory.create({
          data: {
            eventType,
            escalationLevel,
            triggeredBy: 'system',
            caEscalationId: state.id,
          },
        });
      }
    }
  }

  /**
   * Private: Check if escalation should stop
   */
  private shouldStop(context: EscalationContext): boolean {
    // Stop if closed/resolved
    const stopStatuses = ['CLOSED', 'RESOLVED', 'DONE'];
    return stopStatuses.includes(context.status);
  }

  /**
   * Private: Calculate hours overdue
   */
  private calculateHoursOverdue(dueDate: Date, now: Date): number {
    const diff = now.getTime() - dueDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * Private: Map database record to EscalationState
   */
  private mapToEscalationState(record: any): EscalationState {
    return {
      id: record.id,
      entityId: record.nonConformanceId || record.correctiveActionId,
      entityType: record.nonConformanceId ? 'NonConformance' : 'CorrectiveAction',
      currentLevel: record.currentLevel,
      escalationStatus: record.escalationStatus,
      isOverdue: record.isOverdue,
      overdueAt: record.overdueAt,
      lastEscalatedAt: record.lastEscalatedAt,
      nextEscalationAt: record.nextEscalationAt,
      level1NotifiedAt: record.level1NotifiedAt,
      level2NotifiedAt: record.level2NotifiedAt,
      level3NotifiedAt: record.level3NotifiedAt,
      acknowledgedAt: record.acknowledgedAt,
      acknowledgedBy: record.acknowledgedBy,
    };
  }
}

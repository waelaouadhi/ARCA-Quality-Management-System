/**
 * SLA Service
 * Database-driven SLA rules engine
 * 
 * Responsibilities:
 * - Load SLA rules by severity and department
 * - Calculate escalation times
 * - Determine if escalation is due
 */

import { PrismaClient, Severity, EscalationLevel } from '@prisma/client';
import { ISLAService, SLAConfig, EscalationState } from './escalation.types';

export class SLAService implements ISLAService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get applicable SLA rule for severity and department
   * Falls back to global rule if department-specific not found
   */
  async getApplicableRule(severity: Severity, department?: string): Promise<SLAConfig> {
    let rule;

    // Try to find department-specific rule
    if (department) {
      rule = await this.prisma.sLARule.findFirst({
        where: {
          severity,
          departmentId: department,
          isActive: true,
        },
      });
    }

    // Fall back to global rule
    if (!rule) {
      rule = await this.prisma.sLARule.findFirst({
        where: {
          severity,
          departmentId: null,
          isActive: true,
        },
      });
    }

    // Default rule if none configured
    if (!rule) {
      return this.getDefaultRule(severity);
    }

    return this.mapToSLAConfig(rule);
  }

  /**
   * Calculate next escalation time based on level
   */
  getNextEscalationTime(state: EscalationState, rule: SLAConfig): Date {
    if (!state.lastEscalatedAt) {
      // First escalation based on level1DelayHours
      return new Date(Date.now() + rule.level1DelayHours * 60 * 60 * 1000);
    }

    const lastEscalatedTime = state.lastEscalatedAt.getTime();

    switch (state.currentLevel) {
      case EscalationLevel.NONE:
        return new Date(lastEscalatedTime + rule.level1DelayHours * 60 * 60 * 1000);

      case EscalationLevel.LEVEL_1:
        return new Date(lastEscalatedTime + rule.level2DelayHours * 60 * 60 * 1000);

      case EscalationLevel.LEVEL_2:
        return new Date(lastEscalatedTime + rule.level3DelayHours * 60 * 60 * 1000);

      case EscalationLevel.LEVEL_3:
        // No further escalation beyond level 3
        return new Date(Date.now() + 24 * 60 * 60 * 1000);  // Re-check daily

      default:
        return new Date();
    }
  }

  /**
   * Determine if item should escalate based on timing
   */
  shouldEscalate(state: EscalationState, rule: SLAConfig, now: Date = new Date()): boolean {
    // Don't escalate if not overdue
    if (!state.isOverdue) {
      return false;
    }

    // Don't escalate if paused or resolved
    if (
      state.escalationStatus === 'PAUSED' ||
      state.escalationStatus === 'RESOLVED'
    ) {
      return false;
    }

    // Don't escalate if at max level
    if (state.currentLevel === EscalationLevel.LEVEL_3) {
      return false;
    }

    // Check if it's time to escalate
    if (state.nextEscalationAt && now < state.nextEscalationAt) {
      return false;
    }

    return true;
  }

  /**
   * Get next escalation level
   */
  getNextLevel(currentLevel: EscalationLevel): EscalationLevel {
    switch (currentLevel) {
      case EscalationLevel.NONE:
        return EscalationLevel.LEVEL_1;
      case EscalationLevel.LEVEL_1:
        return EscalationLevel.LEVEL_2;
      case EscalationLevel.LEVEL_2:
        return EscalationLevel.LEVEL_3;
      case EscalationLevel.LEVEL_3:
        return EscalationLevel.LEVEL_3;  // No further escalation
      default:
        return EscalationLevel.NONE;
    }
  }

  /**
   * Get recipients for escalation level
   */
  getRecipientsForLevel(rule: SLAConfig, level: EscalationLevel): string[] {
    switch (level) {
      case EscalationLevel.LEVEL_1:
        return rule.level1Recipients;
      case EscalationLevel.LEVEL_2:
        return rule.level2Recipients;
      case EscalationLevel.LEVEL_3:
        return rule.level3Recipients;
      default:
        return [];
    }
  }

  /**
   * Default SLA rule if none configured
   */
  private getDefaultRule(severity: Severity): SLAConfig {
    const defaults = {
      LOW: {
        level1DelayHours: 0,      // Notify immediately
        level2DelayHours: 120,    // Escalate after 5 days
        level3DelayHours: 240,    // Escalate after 10 days
      },
      MEDIUM: {
        level1DelayHours: 0,
        level2DelayHours: 72,     // Escalate after 3 days
        level3DelayHours: 168,    // Escalate after 7 days
      },
      HIGH: {
        level1DelayHours: 0,
        level2DelayHours: 24,     // Escalate after 1 day
        level3DelayHours: 72,     // Escalate after 3 days
      },
      CRITICAL: {
        level1DelayHours: 0,      // Immediate
        level2DelayHours: 2,      // Escalate after 2 hours
        level3DelayHours: 4,      // Escalate after 4 hours
      },
    };

    const config = defaults[severity] || defaults.MEDIUM;

    return {
      severity,
      escalationLevels: [
        EscalationLevel.LEVEL_1,
        EscalationLevel.LEVEL_2,
        EscalationLevel.LEVEL_3,
      ],
      ...config,
      level1Recipients: [],  // Will be populated from entity assignment
      level2Recipients: [],  // Will be populated from manager
      level3Recipients: [],  // Will be populated from admin
      notifyChannels: ['EMAIL', 'IN_APP'],
    };
  }

  /**
   * Map database record to SLAConfig
   */
  private mapToSLAConfig(rule: any): SLAConfig {
    return {
      severity: rule.severity,
      department: rule.departmentId,
      escalationLevels: (rule.escalationLevels || [
        EscalationLevel.LEVEL_1,
        EscalationLevel.LEVEL_2,
        EscalationLevel.LEVEL_3,
      ]) as EscalationLevel[],
      level1DelayHours: rule.level1DelayHours || 0,
      level2DelayHours: rule.level2DelayHours || 24,
      level3DelayHours: rule.level3DelayHours || 48,
      level1Recipients: rule.level1Recipients || [],
      level2Recipients: rule.level2Recipients || [],
      level3Recipients: rule.level3Recipients || [],
      notifyChannels: rule.notifyChannels || ['EMAIL', 'IN_APP'],
    };
  }
}

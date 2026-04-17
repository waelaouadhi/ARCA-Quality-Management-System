/**
 * SLA Configuration Examples
 * 
 * Database-driven SLA rules for different scenarios
 * These would typically be seeded into the database or managed via admin UI
 */

import { Severity, PrismaClient } from '@prisma/client';
import { EscalationLevel, NotificationChannel } from './escalation.types';

/**
 * Seed default SLA rules into database
 */
export async function seedSLARules(prisma: PrismaClient) {
  console.log('📋 Seeding SLA Rules...');

  // CRITICAL severity - immediate escalation
  await prisma.sLARule.upsert({
    where: { name: 'CRITICAL_GLOBAL' },
    update: {},
    create: {
      name: 'CRITICAL_GLOBAL',
      description: 'Critical items escalate immediately and repeatedly',
      severity: 'CRITICAL',
      escalationLevels: [
        EscalationLevel.LEVEL_1,
        EscalationLevel.LEVEL_2,
        EscalationLevel.LEVEL_3,
      ],
      level1DelayHours: 0,      // Immediate
      level2DelayHours: 2,      // After 2 hours
      level3DelayHours: 4,      // After 4 hours
      level1Recipients: [],     // Will be populated from entity
      level2Recipients: [],
      level3Recipients: [],
      notifyChannels: [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
        NotificationChannel.WEBSOCKET,
      ],
      isActive: true,
    },
  });

  // HIGH severity - fast escalation
  await prisma.sLARule.upsert({
    where: { name: 'HIGH_GLOBAL' },
    update: {},
    create: {
      name: 'HIGH_GLOBAL',
      description: 'High-severity items escalate within 1 day',
      severity: 'HIGH',
      escalationLevels: [
        EscalationLevel.LEVEL_1,
        EscalationLevel.LEVEL_2,
        EscalationLevel.LEVEL_3,
      ],
      level1DelayHours: 0,
      level2DelayHours: 24,
      level3DelayHours: 72,
      level1Recipients: [],
      level2Recipients: [],
      level3Recipients: [],
      notifyChannels: [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
      ],
      isActive: true,
    },
  });

  // MEDIUM severity - standard escalation
  await prisma.sLARule.upsert({
    where: { name: 'MEDIUM_GLOBAL' },
    update: {},
    create: {
      name: 'MEDIUM_GLOBAL',
      description: 'Medium-severity items escalate within 3 days',
      severity: 'MEDIUM',
      escalationLevels: [
        EscalationLevel.LEVEL_1,
        EscalationLevel.LEVEL_2,
        EscalationLevel.LEVEL_3,
      ],
      level1DelayHours: 0,
      level2DelayHours: 72,
      level3DelayHours: 168,
      level1Recipients: [],
      level2Recipients: [],
      level3Recipients: [],
      notifyChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      isActive: true,
    },
  });

  // LOW severity - relaxed escalation
  await prisma.sLARule.upsert({
    where: { name: 'LOW_GLOBAL' },
    update: {},
    create: {
      name: 'LOW_GLOBAL',
      description: 'Low-severity items escalate within 5 days',
      severity: 'LOW',
      escalationLevels: [
        EscalationLevel.LEVEL_1,
        EscalationLevel.LEVEL_2,
      ],
      level1DelayHours: 0,
      level2DelayHours: 120,
      level3DelayHours: 240,
      level1Recipients: [],
      level2Recipients: [],
      level3Recipients: [],
      notifyChannels: [NotificationChannel.EMAIL],
      isActive: true,
    },
  });

  console.log('✅ SLA Rules seeded');
}

/**
 * Example: Department-specific SLA (Production Department)
 * Stricter than global rules
 */
export const PRODUCTION_DEPT_SLA = {
  name: 'HIGH_PRODUCTION_DEPT',
  description: 'High-severity items in production escalate faster',
  severity: 'HIGH' as const,
  departmentId: 'dept-production',
  escalationLevels: [
    EscalationLevel.LEVEL_1,
    EscalationLevel.LEVEL_2,
    EscalationLevel.LEVEL_3,
  ],
  level1DelayHours: 0,      // Immediate
  level2DelayHours: 8,      // 8 hours (instead of 24)
  level3DelayHours: 24,     // 24 hours (instead of 72)
  level1Recipients: [],
  level2Recipients: [],
  level3Recipients: [],
  notifyChannels: [
    NotificationChannel.EMAIL,
    NotificationChannel.IN_APP,
    NotificationChannel.WEBSOCKET,
  ],
  isActive: true,
};

/**
 * Example: Quality Department SLA (More relaxed)
 */
export const QUALITY_DEPT_SLA = {
  name: 'MEDIUM_QUALITY_DEPT',
  description: 'Quality department can handle medium items with standard timeline',
  severity: 'MEDIUM' as const,
  departmentId: 'dept-quality',
  escalationLevels: [
    EscalationLevel.LEVEL_1,
    EscalationLevel.LEVEL_2,
  ],
  level1DelayHours: 24,     // 1 day before first notification
  level2DelayHours: 96,     // 4 days before escalation to manager
  level3DelayHours: 192,    // 8 days (rarely needed)
  level1Recipients: [],
  level2Recipients: [],
  level3Recipients: [],
  notifyChannels: [NotificationChannel.EMAIL],
  isActive: true,
};

/**
 * Example SLA Configuration (JSON format for APIs)
 */
export const SLA_CONFIG_EXAMPLE = {
  severityRules: {
    CRITICAL: {
      description: 'Production incident - immediate action required',
      escalationChain: [
        { level: 1, delayMinutes: 0, recipients: ['assigned_user', 'manager'] },
        { level: 2, delayMinutes: 120, recipients: ['manager', 'admin'] },
        { level: 3, delayMinutes: 240, recipients: ['admin', 'cto'] },
      ],
      notificationChannels: ['email', 'in_app', 'websocket', 'sms'],
      slaWindow: '4 hours',
    },
    HIGH: {
      description: 'Significant issue - escalate within 24 hours',
      escalationChain: [
        { level: 1, delayMinutes: 0, recipients: ['assigned_user', 'manager'] },
        { level: 2, delayMinutes: 1440, recipients: ['manager', 'admin'] },
        { level: 3, delayMinutes: 4320, recipients: ['admin'] },
      ],
      notificationChannels: ['email', 'in_app'],
      slaWindow: '3 days',
    },
    MEDIUM: {
      description: 'Standard issue - escalate within 3 days',
      escalationChain: [
        { level: 1, delayMinutes: 0, recipients: ['assigned_user'] },
        { level: 2, delayMinutes: 4320, recipients: ['manager'] },
        { level: 3, delayMinutes: 10080, recipients: ['admin'] },
      ],
      notificationChannels: ['email'],
      slaWindow: '7 days',
    },
    LOW: {
      description: 'Minor issue - standard processing',
      escalationChain: [
        { level: 1, delayMinutes: 0, recipients: ['assigned_user'] },
        { level: 2, delayMinutes: 14400, recipients: ['manager'] },
      ],
      notificationChannels: ['email'],
      slaWindow: '14 days',
    },
  },
};

/**
 * Export for use in seeding
 */
export const DEFAULT_SLA_RULES = [
  {
    name: 'CRITICAL_GLOBAL',
    severity: 'CRITICAL',
    level1DelayHours: 0,
    level2DelayHours: 2,
    level3DelayHours: 4,
  },
  {
    name: 'HIGH_GLOBAL',
    severity: 'HIGH',
    level1DelayHours: 0,
    level2DelayHours: 24,
    level3DelayHours: 72,
  },
  {
    name: 'MEDIUM_GLOBAL',
    severity: 'MEDIUM',
    level1DelayHours: 0,
    level2DelayHours: 72,
    level3DelayHours: 168,
  },
  {
    name: 'LOW_GLOBAL',
    severity: 'LOW',
    level1DelayHours: 0,
    level2DelayHours: 120,
    level3DelayHours: 240,
  },
];

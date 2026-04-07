/**
 * Escalation System Type Definitions
 * 
 * Supports:
 * - Real-time and scheduled detection
 * - Multi-level escalation chains
 * - Configurable SLA rules
 * - Multi-channel notifications
 */

import { Severity } from '@prisma/client';

// ============================================================================
// Core Types
// ============================================================================

export enum EscalationLevel {
  NONE = 'NONE',
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
}

export enum EscalationStatus {
  NONE = 'NONE',
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  PAUSED = 'PAUSED',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  WEBSOCKET = 'WEBSOCKET',
  SMS = 'SMS',
  SLACK = 'SLACK',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

// ============================================================================
// SLA Configuration
// ============================================================================

export interface SLAConfig {
  severity: Severity;
  department?: string;
  
  // Escalation levels to use
  escalationLevels: EscalationLevel[];
  
  // Delay before each escalation (hours)
  level1DelayHours: number;
  level2DelayHours: number;
  level3DelayHours: number;
  
  // Who to notify at each level
  level1Recipients: string[];  // Assigned user, manager
  level2Recipients: string[];  // Manager, admin
  level3Recipients: string[];  // Admin, director
  
  // Notification channels
  notifyChannels: NotificationChannel[];
}

// ============================================================================
// Escalation Context
// ============================================================================

export interface EscalationContext {
  entityId: string;
  entityType: 'NonConformance' | 'CorrectiveAction';
  dueDate: Date;
  severity: Severity;
  status: string;
  assignedToId?: string;
  departmentId?: string;
}

export interface EscalationState {
  id: string;
  entityId: string;
  entityType: 'NonConformance' | 'CorrectiveAction';
  currentLevel: EscalationLevel;
  escalationStatus: EscalationStatus;
  isOverdue: boolean;
  overdueAt?: Date;
  lastEscalatedAt?: Date;
  nextEscalationAt?: Date;
  level1NotifiedAt?: Date;
  level2NotifiedAt?: Date;
  level3NotifiedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationPayload {
  recipientEmail?: string;
  recipientUserId?: string;
  entityId: string;
  entityType: 'NonConformance' | 'CorrectiveAction';
  entityTitle: string;
  severity: Severity;
  escalationLevel: EscalationLevel;
  dueDate: Date;
  channels: NotificationChannel[];
  idempotencyKey: string;
}

export interface ChannelNotification {
  channel: NotificationChannel;
  recipientAddress: string;  // email, phone, webhook URL, etc.
  subject: string;
  body: string;
  data?: Record<string, any>;
}

// ============================================================================
// Escalation Events
// ============================================================================

export type EscalationEventType =
  | 'OVERDUE_DETECTED'
  | 'ESCALATED_TO_LEVEL_1'
  | 'ESCALATED_TO_LEVEL_2'
  | 'ESCALATED_TO_LEVEL_3'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'PAUSED'
  | 'NOTIFICATION_SENT'
  | 'NOTIFICATION_FAILED';

export interface EscalationEvent {
  eventType: EscalationEventType;
  entityId: string;
  entityType: 'NonConformance' | 'CorrectiveAction';
  escalationLevel: EscalationLevel;
  reason?: string;
  triggeredBy?: string;  // system, user email, etc.
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// Batch Processing
// ============================================================================

export interface EscalationBatch {
  items: EscalationContext[];
  timestamp: Date;
  processedCount: number;
  failedCount: number;
  errors: Array<{ itemId: string; error: string }>;
}

export interface OverdueItem {
  id: string;
  type: 'NonConformance' | 'CorrectiveAction';
  dueDate: Date;
  severity: Severity;
  title: string;
  assignedToId?: string;
  status: string;
  hoursOverdue: number;
}

// ============================================================================
// Stop Conditions
// ============================================================================

export interface StopCondition {
  type: 'CLOSED' | 'RESOLVED' | 'ACKNOWLEDGED' | 'CUSTOM';
  value?: any;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface IEscalationService {
  detectOverdueItems(): Promise<OverdueItem[]>;
  escalate(context: EscalationContext): Promise<EscalationState>;
  acknowledge(entityId: string, entityType: string, acknowledgedBy: string): Promise<void>;
  pauseEscalation(entityId: string, entityType: string): Promise<void>;
  resumeEscalation(entityId: string, entityType: string): Promise<void>;
  getState(entityId: string, entityType: string): Promise<EscalationState | null>;
}

export interface ISLAService {
  getApplicableRule(severity: Severity, department?: string): Promise<SLAConfig>;
  getNextEscalationTime(state: EscalationState, rule: SLAConfig): Date;
  shouldEscalate(state: EscalationState, rule: SLAConfig, now: Date): boolean;
}

export interface INotificationService {
  send(payload: NotificationPayload): Promise<string>;  // Returns notification ID
  retry(notificationId: string): Promise<void>;
  getStatus(notificationId: string): Promise<NotificationStatus>;
}

export interface IEscalationWorker {
  runOnce(): Promise<EscalationBatch>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

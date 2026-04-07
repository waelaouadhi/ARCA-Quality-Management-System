/**
 * Escalation Module Export
 */

export * from './escalation.types';
export { EscalationService } from './escalation.service';
export { SLAService } from './sla.service';
export { NotificationService } from './notification.service';
export { EscalationWorker, setupEscalationWorker } from './escalation.worker';
export { seedSLARules, DEFAULT_SLA_RULES } from './sla.config';
export {
  scenario1_CriticalNC,
  scenario2_HighCAWithDeptSLA,
  scenario3_AcknowledgmentStopsEscalation,
  scenario4_ResolutionStopsEscalation,
  scenario5_BatchProcessing,
  scenario6_IdempotencyPrevention,
  runAllScenarios,
} from './escalation.examples';

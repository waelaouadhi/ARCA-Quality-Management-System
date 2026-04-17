import { PrismaClient, WorkflowInstance, WorkflowStep, WorkflowTransition } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';
import { JWTPayload } from '@/shared/utils/jwt';

/**
 * Condition evaluation engine
 * Evaluates JSON conditions against context data
 */
interface ConditionRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}

interface Condition {
  operator: 'AND' | 'OR';
  rules: ConditionRule[];
}

/**
 * Workflow Engine - Core state machine logic
 * Manages workflow transitions, validation, and event emission
 */
export class WorkflowEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get available transitions from current step
   */
  async getAvailableTransitions(
    instanceId: string
  ): Promise<(WorkflowTransition & { toStep: WorkflowStep })[]> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { workflow: true, currentStep: true },
    });

    if (!instance) {
      throw new AppError('Workflow instance not found', 404);
    }

    if (!instance.currentStepId) {
      throw new AppError('Workflow instance has no current step', 400);
    }

    // Get all transitions from current step
    const transitions = await this.prisma.workflowTransition.findMany({
      where: {
        workflowId: instance.workflowId,
        fromStepId: instance.currentStepId,
      },
      include: { toStep: true },
      orderBy: { displayOrder: 'asc' },
    });

    return transitions;
  }

  /**
   * Evaluate if a transition is allowed based on conditions
   */
  private evaluateConditions(
    conditions: Condition | null,
    contextData: Record<string, any>
  ): boolean {
    if (!conditions) {
      return true; // No conditions = always allowed
    }

    const { operator, rules } = conditions;

    const results = rules.map((rule) => this.evaluateRule(rule, contextData));

    if (operator === 'AND') {
      return results.every((r) => r);
    } else if (operator === 'OR') {
      return results.some((r) => r);
    }

    return true;
  }

  /**
   * Evaluate a single condition rule
   */
  private evaluateRule(rule: ConditionRule, contextData: Record<string, any>): boolean {
    const value = this.getNestedValue(contextData, rule.field);

    switch (rule.operator) {
      case 'eq':
        return value === rule.value;
      case 'ne':
        return value !== rule.value;
      case 'gt':
        return value > rule.value;
      case 'lt':
        return value < rule.value;
      case 'gte':
        return value >= rule.value;
      case 'lte':
        return value <= rule.value;
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(value);
      case 'contains':
        return String(value).includes(String(rule.value));
      default:
        return true;
    }
  }

  /**
   * Get nested value from object by dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Can user transition to a step?
   */
  async canTransition(
    instanceId: string,
    targetStepId: string,
    currentUser: JWTPayload
  ): Promise<boolean> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || instance.status !== 'ACTIVE') {
      return false;
    }

    const transition = await this.prisma.workflowTransition.findUnique({
      where: {
        fromStepId_toStepId_workflowId: {
          fromStepId: instance.currentStepId || '',
          toStepId: targetStepId,
          workflowId: instance.workflowId,
        },
      },
      include: { toStep: true },
    });

    if (!transition) {
      return false;
    }

    // Check if transition requires approval from specific role
    if (transition.toStep.requiresApproval && transition.toStep.approverRole) {
      if (currentUser.role !== transition.toStep.approverRole) {
        return false;
      }
    }

    // Evaluate conditions if any
    const contextData = instance.contextData ? JSON.parse(instance.contextData) : {};
    const conditions = transition.conditions ? JSON.parse(transition.conditions) : null;

    return this.evaluateConditions(conditions, contextData);
  }

  /**
   * Transition workflow to next step
   */
  async transitionToStep(
    instanceId: string,
    targetStepId: string,
    currentUser: JWTPayload,
    comment?: string,
    metadata?: Record<string, any>
  ): Promise<WorkflowInstance> {
    // Verify can transition
    const allowed = await this.canTransition(instanceId, targetStepId, currentUser);
    if (!allowed) {
      throw new AppError('Transition not allowed', 403);
    }

    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || !instance.currentStepId) {
      throw new AppError('Invalid workflow instance', 400);
    }

    const transition = await this.prisma.workflowTransition.findUnique({
      where: {
        fromStepId_toStepId_workflowId: {
          fromStepId: instance.currentStepId,
          toStepId: targetStepId,
          workflowId: instance.workflowId,
        },
      },
    });

    if (!transition) {
      throw new AppError('Invalid transition', 400);
    }

    // Get target step
    const targetStep = await this.prisma.workflowStep.findUnique({
      where: { id: targetStepId },
    });

    if (!targetStep) {
      throw new AppError('Target step not found', 404);
    }

    // Update instance and create event in transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update instance
      const newInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          currentStepId: targetStepId,
          updatedAt: new Date(),
        },
      });

      // Create event
      await tx.workflowInstanceEvent.create({
        data: {
          instanceId,
          transitionId: transition.id,
          eventType: 'transitioned',
          fromStep: instance.currentStepId,
          toStep: targetStepId,
          performedBy: currentUser.userId,
          comment,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return newInstance;
    });

    return updated;
  }

  /**
   * Complete workflow
   */
  async completeWorkflow(
    instanceId: string,
    currentUser: JWTPayload
  ): Promise<WorkflowInstance> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new AppError('Workflow instance not found', 404);
    }

    if (instance.status !== 'ACTIVE') {
      throw new AppError('Workflow already completed', 400);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update instance
      const newInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedBy: currentUser.userId,
          updatedAt: new Date(),
        },
      });

      // Create completion event
      await tx.workflowInstanceEvent.create({
        data: {
          instanceId,
          eventType: 'completed',
          fromStep: instance.currentStepId || '',
          performedBy: currentUser.userId,
        },
      });

      return newInstance;
    });

    return updated;
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(
    instanceId: string,
    currentUser: JWTPayload,
    reason?: string
  ): Promise<WorkflowInstance> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new AppError('Workflow instance not found', 404);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const newInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: 'PAUSED',
          updatedAt: new Date(),
        },
      });

      await tx.workflowInstanceEvent.create({
        data: {
          instanceId,
          eventType: 'paused',
          fromStep: instance.currentStepId || '',
          performedBy: currentUser.userId,
          comment: reason,
        },
      });

      return newInstance;
    });

    return updated;
  }

  /**
   * Resume paused workflow
   */
  async resumeWorkflow(
    instanceId: string,
    currentUser: JWTPayload
  ): Promise<WorkflowInstance> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new AppError('Workflow instance not found', 404);
    }

    if (instance.status !== 'PAUSED') {
      throw new AppError('Workflow is not paused', 400);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const newInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      await tx.workflowInstanceEvent.create({
        data: {
          instanceId,
          eventType: 'resumed',
          fromStep: instance.currentStepId || '',
          performedBy: currentUser.userId,
        },
      });

      return newInstance;
    });

    return updated;
  }

  /**
   * Get workflow history
   */
  async getWorkflowHistory(
    instanceId: string
  ): Promise<any[]> {
    const events = await this.prisma.workflowInstanceEvent.findMany({
      where: { instanceId },
      orderBy: { performedAt: 'asc' },
    });

    return events.map((event) => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : null,
    }));
  }

  /**
   * Get current step info
   */
  async getCurrentStep(
    instanceId: string
  ): Promise<WorkflowStep | null> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { currentStep: true },
    });

    return instance?.currentStep || null;
  }

  /**
   * Auto-transition if workflow has automatic transitions
   * Used by background jobs
   */
  async processAutomaticTransitions(
    instanceId: string
  ): Promise<boolean> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { workflow: true, currentStep: true },
    });

    if (!instance || instance.status !== 'ACTIVE' || !instance.currentStepId) {
      return false;
    }

    // Get automatic transitions
    const transitions = await this.prisma.workflowTransition.findMany({
      where: {
        fromStepId: instance.currentStepId,
        triggerType: 'automatic',
      },
      include: { toStep: true },
    });

    if (transitions.length === 0) {
      return false;
    }

    // Try first automatic transition
    const transition = transitions[0];
    const contextData = instance.contextData ? JSON.parse(instance.contextData) : {};
    const conditions = transition.conditions ? JSON.parse(transition.conditions) : null;

    if (this.evaluateConditions(conditions, contextData)) {
      await this.transitionToStep(instanceId, transition.toStepId, {
        userId: 'system',
        email: 'system@qms.local',
        role: 'ADMIN',
      });
      return true;
    }

    return false;
  }

  /**
   * Validate workflow configuration
   */
  async validateWorkflowConfig(
    workflowId: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { instances: { take: 1 } },
    });

    if (!workflow) {
      return { valid: false, errors: ['Workflow not found'] };
    }

    const steps = await this.prisma.workflowStep.findMany({
      where: { workflowId },
      orderBy: { stepOrder: 'asc' },
    });

    if (steps.length === 0) {
      errors.push('Workflow has no steps defined');
    }

    // Check for unreachable steps
    const startStep = steps.find((s) => s.stepOrder === 1);
    if (!startStep) {
      errors.push('No starting step (stepOrder 1) defined');
    }

    // Validate all transitions reference existing steps
    const transitions = await this.prisma.workflowTransition.findMany({
      where: { workflowId },
    });

    const stepIds = new Set(steps.map((s) => s.id));

    for (const transition of transitions) {
      if (!stepIds.has(transition.fromStepId)) {
        errors.push(`Transition from non-existent step: ${transition.fromStepId}`);
      }
      if (!stepIds.has(transition.toStepId)) {
        errors.push(`Transition to non-existent step: ${transition.toStepId}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

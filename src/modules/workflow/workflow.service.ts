import { PrismaClient } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';
import { JWTPayload } from '@/shared/utils/jwt';

/**
 * Workflow Service - High-level workflow operations
 * Coordinates between modules and the workflow engine
 */
export class WorkflowService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Start a new workflow instance for a resource
   */
  async startWorkflow(
    workflowId: string,
    resourceType: string,
    resourceId: string,
    currentUser: JWTPayload,
    contextData?: Record<string, any>
  ) {
    // Verify workflow exists and is active
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow || !workflow.isActive) {
      throw new AppError('Workflow not found or inactive', 404);
    }

    // Get first step
    const firstStep = await this.prisma.workflowStep.findFirst({
      where: { workflowId },
      orderBy: { stepOrder: 'asc' },
    });

    if (!firstStep) {
      throw new AppError('Workflow has no steps defined', 400);
    }

    // Create instance
    const instance = await this.prisma.workflowInstance.create({
      data: {
        workflowId,
        resourceType,
        resourceId,
        currentStepId: firstStep.id,
        startedBy: currentUser.userId,
        contextData: contextData ? JSON.stringify(contextData) : null,
        status: 'ACTIVE',
      },
    });

    // Create initial event
    await this.prisma.workflowInstanceEvent.create({
      data: {
        instanceId: instance.id,
        eventType: 'started',
        fromStep: '',
        toStep: firstStep.name,
        performedBy: currentUser.userId,
      },
    });

    return instance;
  }

  /**
   * Get active workflow for a resource
   */
  async getActiveWorkflow(resourceType: string, resourceId: string) {
    return await this.prisma.workflowInstance.findFirst({
      where: {
        resourceType,
        resourceId,
        status: 'ACTIVE',
      },
      include: {
        workflow: true,
        currentStep: true,
      },
    });
  }

  /**
   * Get workflow instance details
   */
  async getWorkflowInstance(instanceId: string) {
    return await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: true,
        currentStep: true,
      },
    });
  }

  /**
   * Get all workflow instances for a resource
   */
  async getResourceWorkflows(resourceType: string, resourceId: string) {
    return await this.prisma.workflowInstance.findMany({
      where: {
        resourceType,
        resourceId,
      },
      include: {
        workflow: true,
        currentStep: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Update context data for running workflow
   */
  async updateWorkflowContext(
    instanceId: string,
    contextData: Record<string, any>
  ) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new AppError('Workflow instance not found', 404);
    }

    const existing = instance.contextData ? JSON.parse(instance.contextData) : {};
    const merged = { ...existing, ...contextData };

    return await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        contextData: JSON.stringify(merged),
      },
    });
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(workflowId: string) {
    const [total, active, completed, paused, cancelled] = await Promise.all([
      this.prisma.workflowInstance.count({
        where: { workflowId },
      }),
      this.prisma.workflowInstance.count({
        where: { workflowId, status: 'ACTIVE' },
      }),
      this.prisma.workflowInstance.count({
        where: { workflowId, status: 'COMPLETED' },
      }),
      this.prisma.workflowInstance.count({
        where: { workflowId, status: 'PAUSED' },
      }),
      this.prisma.workflowInstance.count({
        where: { workflowId, status: 'CANCELLED' },
      }),
    ]);

    return {
      total,
      active,
      completed,
      paused,
      cancelled,
    };
  }

  /**
   * Get average completion time for workflow
   */
  async getAverageCompletionTime(workflowId: string): Promise<number | null> {
    const completed = await this.prisma.workflowInstance.findMany({
      where: {
        workflowId,
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    if (completed.length === 0) {
      return null;
    }

    const times = completed.map((c) => {
      const start = new Date(c.startedAt).getTime();
      const end = new Date(c.completedAt!).getTime();
      return (end - start) / 1000 / 60; // minutes
    });

    const sum = times.reduce((a, b) => a + b, 0);
    return Math.round(sum / times.length);
  }

  /**
   * Create a new workflow definition
   */
  async createWorkflow(
    name: string,
    moduleType: string,
    description: string | undefined,
    config: Record<string, any>,
    currentUser: JWTPayload
  ) {
    return await this.prisma.workflow.create({
      data: {
        name,
        moduleType,
        description,
        config: JSON.stringify(config),
        createdBy: currentUser.userId,
      },
    });
  }

  /**
   * Update workflow definition (creates new version)
   */
  async updateWorkflow(
    workflowId: string,
    config: Record<string, any>,
    currentUser: JWTPayload
  ) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }

    return await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        version: workflow.version + 1,
        config: JSON.stringify(config),
        updatedBy: currentUser.userId,
      },
    });
  }

  /**
   * Disable workflow
   */
  async disableWorkflow(workflowId: string, currentUser: JWTPayload) {
    return await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        isActive: false,
        updatedBy: currentUser.userId,
      },
    });
  }

  /**
   * Enable workflow
   */
  async enableWorkflow(workflowId: string, currentUser: JWTPayload) {
    return await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        isActive: true,
        updatedBy: currentUser.userId,
      },
    });
  }

  /**
   * Get workflow by name
   */
  async getWorkflowByName(name: string) {
    return await this.prisma.workflow.findUnique({
      where: { name },
    });
  }

  /**
   * List workflows
   */
  async listWorkflows(moduleType?: string) {
    return await this.prisma.workflow.findMany({
      where: moduleType ? { moduleType } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }
}

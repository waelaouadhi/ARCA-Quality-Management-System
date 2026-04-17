import { JWTPayload, requireAuthentication, AuthorizationPolicies, createAuthContext } from '@/shared/utils';
import { WorkflowEngine } from './workflow.engine';
import { ValidationError, NotFoundError } from '@/shared/errors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const workflowResolvers = {
  Query: {
    getAvailableTransitions: async (_: any, { instanceId }: { instanceId: string }, { currentUser }: { currentUser?: JWTPayload }) => {
      const user = requireAuthentication(currentUser);
      const workflowEngine = new WorkflowEngine(prisma);

      const instance = await prisma.workflowInstance.findUnique({
        where: { id: instanceId },
      });

      if (!instance) {
        throw new NotFoundError('Workflow instance not found');
      }

      // Check authorization based on resource type
      if (instance.resourceType === 'DOCUMENT') {
        AuthorizationPolicies.document.update().authorize(createAuthContext(user, 'update'));
      } else if (instance.resourceType === 'NONCONFORMANCE') {
        AuthorizationPolicies.nonConformance.update().authorize(createAuthContext(user, 'update'));
      } else if (instance.resourceType === 'CORRECTIVEACTION') {
        AuthorizationPolicies.correctiveAction.update().authorize(createAuthContext(user, 'update'));
      }

      const transitions = await workflowEngine.getAvailableTransitions(instanceId);
      return transitions.map((t) => t.toStepId);
    },

    getWorkflowInstance: async (_: any, { instanceId }: { instanceId: string }, { currentUser }: { currentUser?: JWTPayload }) => {
      const user = requireAuthentication(currentUser);

      const instance = await prisma.workflowInstance.findUnique({
        where: { id: instanceId },
      });

      if (!instance) {
        throw new NotFoundError('Workflow instance not found');
      }

      // Check authorization
      if (instance.resourceType === 'DOCUMENT') {
        AuthorizationPolicies.document.read().authorize(createAuthContext(user, 'read'));
      } else if (instance.resourceType === 'NONCONFORMANCE') {
        AuthorizationPolicies.nonConformance.read().authorize(createAuthContext(user, 'read'));
      }

      return {
        ...instance,
        startedAt: instance.startedAt.toISOString(),
        completedAt: instance.completedAt ? instance.completedAt.toISOString() : null,
      };
    },

    getWorkflowHistory: async (
      _: any,
      { resourceType, resourceId }: { resourceType: string; resourceId: string },
      { currentUser }: { currentUser?: JWTPayload }
    ) => {
      const user = requireAuthentication(currentUser);

      // Check authorization
      if (resourceType === 'DOCUMENT') {
        AuthorizationPolicies.document.read().authorize(createAuthContext(user, 'read'));
      } else if (resourceType === 'NONCONFORMANCE') {
        AuthorizationPolicies.nonConformance.read().authorize(createAuthContext(user, 'read'));
      }

      const events = await prisma.workflowInstanceEvent.findMany({
        where: {
          instance: {
            resourceType,
            resourceId,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return events.map((e) => ({
        ...e,
        performedAt: e.performedAt.toISOString(),
      }));
    },
  },

  Mutation: {
    transitionWorkflow: async (
      _: any,
      { instanceId, targetStepId, comment }: { instanceId: string; targetStepId: string; comment?: string },
      { currentUser }: { currentUser?: JWTPayload }
    ) => {
      const user = requireAuthentication(currentUser);
      const workflowEngine = new WorkflowEngine(prisma);

      const instance = await prisma.workflowInstance.findUnique({
        where: { id: instanceId },
      });

      if (!instance) {
        throw new NotFoundError('Workflow instance not found');
      }

      // Check authorization
      if (instance.resourceType === 'DOCUMENT') {
        AuthorizationPolicies.document.update().authorize(createAuthContext(user, 'update'));
      } else if (instance.resourceType === 'NONCONFORMANCE') {
        AuthorizationPolicies.nonConformance.update().authorize(createAuthContext(user, 'update'));
      } else if (instance.resourceType === 'CORRECTIVEACTION') {
        AuthorizationPolicies.correctiveAction.update().authorize(createAuthContext(user, 'update'));
      }

      const updated = await workflowEngine.transitionToStep(instanceId, targetStepId, user, comment);

      return {
        ...updated,
        startedAt: updated.startedAt.toISOString(),
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
      };
    },
  },
};

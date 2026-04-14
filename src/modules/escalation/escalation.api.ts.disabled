/**
 * Escalation System - API Integration Examples
 * 
 * GraphQL resolvers and REST endpoints for escalation management
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest, authorize } from '@/shared/middleware';
import {
  EscalationService,
  SLAService,
  EscalationWorker,
  EscalationLevel,
} from '@/modules/escalation';

const router = Router();
const prisma = new PrismaClient();
const escalationService = new EscalationService(prisma);
const slaService = new SLAService(prisma);

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

/**
 * GET /api/escalations
 * List all active escalations (with filters)
 */
router.get('/escalations', authenticateRequest, async (req, res) => {
  try {
    const { severity, status, entityType, limit = 50 } = req.query;

    const filters: any = {};
    if (severity) filters.severity = severity;
    if (status) filters.escalationStatus = status;

    let escalations;

    if (entityType === 'NonConformance') {
      escalations = await prisma.nonConformanceEscalation.findMany({
        where: filters,
        include: {
          nonConformance: {
            select: { title: true, severity: true, status: true },
          },
        },
        take: parseInt(limit as string),
        orderBy: { lastEscalatedAt: 'desc' },
      });
    } else if (entityType === 'CorrectiveAction') {
      escalations = await prisma.correctiveActionEscalation.findMany({
        where: filters,
        include: {
          correctiveAction: {
            select: { action: true },
            include: { nonConformance: { select: { severity: true } } },
          },
        },
        take: parseInt(limit as string),
        orderBy: { lastEscalatedAt: 'desc' },
      });
    } else {
      // Both types
      const ncs = await prisma.nonConformanceEscalation.findMany({
        where: filters,
        take: parseInt(limit as string),
      });
      const cas = await prisma.correctiveActionEscalation.findMany({
        where: filters,
        take: parseInt(limit as string),
      });
      escalations = [...ncs, ...cas];
    }

    res.json(escalations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch escalations' });
  }
});

/**
 * GET /api/escalations/:entityType/:entityId
 * Get escalation state for specific entity
 */
router.get('/escalations/:entityType/:entityId', authenticateRequest, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const state = await escalationService.getState(entityId, entityType);

    if (!state) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    // Get audit history
    const history = await prisma.escalationHistory.findMany({
      where:
        entityType === 'NonConformance'
          ? { ncEscalationId: state.id }
          : { caEscalationId: state.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      state,
      history,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch escalation' });
  }
});

/**
 * POST /api/escalations/:entityType/:entityId/acknowledge
 * Acknowledge escalation (stops further escalation)
 */
router.post(
  '/escalations/:entityType/:entityId/acknowledge',
  authenticateRequest,
  authorize(['MANAGER', 'ADMIN']),
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const { user } = req;

      await escalationService.acknowledge(entityId, entityType, user.email);

      res.json({ message: 'Escalation acknowledged' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to acknowledge' });
    }
  }
);

/**
 * POST /api/escalations/:entityType/:entityId/pause
 * Pause escalation temporarily
 */
router.post(
  '/escalations/:entityType/:entityId/pause',
  authenticateRequest,
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;

      await escalationService.pauseEscalation(entityId, entityType);

      res.json({ message: 'Escalation paused' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to pause' });
    }
  }
);

/**
 * POST /api/escalations/:entityType/:entityId/resume
 * Resume escalation
 */
router.post(
  '/escalations/:entityType/:entityId/resume',
  authenticateRequest,
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;

      await escalationService.resumeEscalation(entityId, entityType);

      res.json({ message: 'Escalation resumed' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to resume' });
    }
  }
);

/**
 * GET /api/escalations/:entityType/:entityId/history
 * Get audit trail for entity
 */
router.get('/escalations/:entityType/:entityId/history', authenticateRequest, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const state = await escalationService.getState(entityId, entityType);
    if (!state) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    const history = await prisma.escalationHistory.findMany({
      where:
        entityType === 'NonConformance'
          ? { ncEscalationId: state.id }
          : { caEscalationId: state.id },
      include: {
        ncEscalation: { select: { nonConformance: { select: { title: true } } } },
        caEscalation: { select: { correctiveAction: { select: { action: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * GET /api/sla-rules
 * List all SLA rules
 */
router.get('/sla-rules', authenticateRequest, authorize(['MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const { severity, department, isActive } = req.query;

    const rules = await prisma.sLARule.findMany({
      where: {
        severity: severity as any,
        departmentId: department as string,
        isActive: isActive ? isActive === 'true' : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch SLA rules' });
  }
});

/**
 * POST /api/sla-rules
 * Create new SLA rule
 */
router.post('/sla-rules', authenticateRequest, authorize(['ADMIN']), async (req, res) => {
  try {
    const {
      name,
      description,
      severity,
      departmentId,
      level1DelayHours,
      level2DelayHours,
      level3DelayHours,
      notifyChannels,
    } = req.body;

    const rule = await prisma.sLARule.create({
      data: {
        name,
        description,
        severity,
        departmentId,
        level1DelayHours,
        level2DelayHours,
        level3DelayHours,
        notifyChannels,
        isActive: true,
      },
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create SLA rule' });
  }
});

/**
 * PUT /api/sla-rules/:ruleId
 * Update SLA rule
 */
router.put('/sla-rules/:ruleId', authenticateRequest, authorize(['ADMIN']), async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = await prisma.sLARule.update({
      where: { id: ruleId },
      data: updates,
    });

    res.json(rule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update SLA rule' });
  }
});

/**
 * POST /api/escalation/trigger
 * Manually trigger escalation worker (for testing)
 */
router.post('/escalation/trigger', authenticateRequest, authorize(['ADMIN']), async (req, res) => {
  try {
    console.log('🚀 Manual escalation trigger by', req.user.email);

    const worker = new EscalationWorker(prisma);
    const batch = await worker.runOnce();

    res.json({
      status: 'success',
      batch: {
        timestamp: batch.timestamp,
        itemsProcessed: batch.processedCount,
        itemsFailed: batch.failedCount,
        totalItems: batch.items.length,
        errors: batch.errors,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to trigger escalation' });
  }
});

/**
 * GET /api/notifications/:notificationId
 * Get notification status
 */
router.get(
  '/notifications/:notificationId',
  authenticateRequest,
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const { notificationId } = req.params;

      const notif = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notif) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json(notif);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch notification' });
    }
  }
);

/**
 * POST /api/notifications/:notificationId/retry
 * Manually retry failed notification
 */
router.post(
  '/notifications/:notificationId/retry',
  authenticateRequest,
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const { notificationId } = req.params;

      const notificationService = new (require('@/modules/escalation').NotificationService)(prisma);
      await notificationService.retry(notificationId);

      res.json({ message: 'Retry scheduled' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to retry notification' });
    }
  }
);

// ============================================================================
// GRAPHQL RESOLVERS
// ============================================================================

export const escalationResolvers = {
  Query: {
    /**
     * Get escalation state for entity
     */
    escalationState: async (
      _parent,
      { entityId, entityType }: { entityId: string; entityType: string },
      { prisma }
    ) => {
      return await escalationService.getState(entityId, entityType);
    },

    /**
     * List all active escalations
     */
    escalations: async (
      _parent,
      { severity, status, limit = 50 }: any,
      { prisma }
    ) => {
      const ncs = await prisma.nonConformanceEscalation.findMany({
        where: {
          severity,
          escalationStatus: status,
        },
        take: limit,
      });

      const cas = await prisma.correctiveActionEscalation.findMany({
        where: {
          escalationStatus: status,
        },
        take: limit,
      });

      return [...ncs, ...cas];
    },

    /**
     * Get SLA rule
     */
    slaRule: async (_parent, { severity, department }: any) => {
      return await slaService.getApplicableRule(severity, department);
    },

    /**
     * Get escalation audit history
     */
    escalationHistory: async (
      _parent,
      { entityId, entityType, limit = 20 }: any,
      { prisma }
    ) => {
      const state = await escalationService.getState(entityId, entityType);
      if (!state) return [];

      return await prisma.escalationHistory.findMany({
        where:
          entityType === 'NonConformance'
            ? { ncEscalationId: state.id }
            : { caEscalationId: state.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    },
  },

  Mutation: {
    /**
     * Acknowledge escalation
     */
    acknowledgeEscalation: async (
      _parent,
      { entityId, entityType }: { entityId: string; entityType: string },
      { user, prisma }
    ) => {
      await escalationService.acknowledge(entityId, entityType, user.email);
      return { success: true, message: 'Escalation acknowledged' };
    },

    /**
     * Pause escalation
     */
    pauseEscalation: async (
      _parent,
      { entityId, entityType }: { entityId: string; entityType: string },
      { user, authorize }
    ) => {
      authorize(['ADMIN']);
      await escalationService.pauseEscalation(entityId, entityType);
      return { success: true, message: 'Escalation paused' };
    },

    /**
     * Resume escalation
     */
    resumeEscalation: async (
      _parent,
      { entityId, entityType }: { entityId: string; entityType: string },
      { user, authorize }
    ) => {
      authorize(['ADMIN']);
      await escalationService.resumeEscalation(entityId, entityType);
      return { success: true, message: 'Escalation resumed' };
    },

    /**
     * Create SLA rule
     */
    createSLARule: async (
      _parent,
      { input }: any,
      { user, authorize, prisma }
    ) => {
      authorize(['ADMIN']);

      return await prisma.sLARule.create({
        data: {
          ...input,
          isActive: true,
        },
      });
    },

    /**
     * Trigger escalation worker manually
     */
    triggerEscalation: async (_parent, _args, { user, authorize, prisma }) => {
      authorize(['ADMIN']);

      const worker = new EscalationWorker(prisma);
      const batch = await worker.runOnce();

      return {
        success: true,
        itemsProcessed: batch.processedCount,
        itemsFailed: batch.failedCount,
        totalItems: batch.items.length,
      };
    },
  },
};

// ============================================================================
// WEBSOCKET INTEGRATION (Real-time escalation alerts)
// ============================================================================

/**
 * Register user for real-time escalation notifications
 */
export function registerEscalationSocket(io, socket, userId: string) {
  const notificationService = new (require('@/modules/escalation').NotificationService)(prisma);

  // Register WebSocket connection
  notificationService.registerWebSocketConnection(userId, socket);

  // Listen for escalation events
  socket.on('escalation:subscribe', () => {
    socket.join(`escalation:${userId}`);
    socket.emit('escalation:ready', { userId });
  });

  // When escalation happens, broadcast to user
  socket.on('escalation:alert', (event) => {
    io.to(`escalation:${userId}`).emit('escalation:alert', {
      entityId: event.entityId,
      escalationLevel: event.escalationLevel,
      severity: event.severity,
      timestamp: new Date(),
      actionRequired: true,
    });
  });
}

export default router;

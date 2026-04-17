/**
 * EXAMPLE: Scope-Aware NonConformance Service
 * 
 * This shows how to modify the existing NonConformanceService to support scopes
 */

import { NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload, requireAuthentication } from '@/shared/utils';
import {
  ScopedAuthorizationPolicies,
  createScopedAuthContext,
  buildScopeFilter,
  validateScopeForCreate,
} from '@/shared/utils/scopedAuthorization';
import { PrismaClient } from '@prisma/client';
import { ScopeService } from '@/modules/scope/scope.service';

const prisma = new PrismaClient();
const scopeService = new ScopeService();

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type NCStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface CreateNonConformanceInput {
  title: string;
  description: string;
  severity?: Severity;
  scopeId: string; // NEW: Required scope ID
}

interface UpdateNonConformanceInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: NCStatus;
}

export class ScopedNonConformanceService {
  /**
   * Create NonConformance with scope
   */
  async createNonConformance(input: CreateNonConformanceInput, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Get user's scope IDs
    const userScopeIds = await scopeService.getUserScopeIds(user.userId);

    // Validate user can create in this scope
    validateScopeForCreate(user, userScopeIds, input.scopeId);

    // Authorization check
    ScopedAuthorizationPolicies.nonConformance.create().authorize(
      createScopedAuthContext(user, 'create', userScopeIds, { scopeId: input.scopeId })
    );

    // Create NonConformance
    return prisma.nonConformance.create({
      data: {
        title: input.title,
        description: input.description,
        severity: input.severity || 'MEDIUM',
        reportedById: user.userId,
        scopeId: input.scopeId,
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        scope: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get NonConformances with scope filtering
   */
  async getNonConformances(
    paginationInput: PaginationInput = {},
    filters: { status?: NCStatus; severity?: Severity; scopeId?: string } = {},
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);

    // Get user's scope IDs
    const userScopeIds = await scopeService.getUserScopeIds(user.userId);

    // Build scope filter
    const scopeFilter = buildScopeFilter(user, userScopeIds);

    // If user provided scopeId filter, validate they have access
    let finalScopeFilter = scopeFilter;
    if (filters.scopeId) {
      if (user.role !== 'ADMIN' && !userScopeIds.includes(filters.scopeId)) {
        throw new ValidationError('You do not have access to this scope');
      }
      finalScopeFilter = { scopeId: filters.scopeId };
    }

    const where = {
      ...finalScopeFilter,
      ...(filters.status && { status: filters.status }),
      ...(filters.severity && { severity: filters.severity }),
    };

    const [items, total] = await Promise.all([
      prisma.nonConformance.findMany({
        where,
        skip: paginationInput.skip || 0,
        take: paginationInput.take || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          scope: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              correctiveActions: true,
            },
          },
        },
      }),
      prisma.nonConformance.count({ where }),
    ]);

    return {
      items,
      total,
      page: Math.floor((paginationInput.skip || 0) / (paginationInput.take || 10)) + 1,
      pageSize: paginationInput.take || 10,
    };
  }

  /**
   * Get NonConformance by ID with scope check
   */
  async getNonConformanceById(id: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    const nonConformance = await prisma.nonConformance.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        scope: {
          select: {
            id: true,
            name: true,
          },
        },
        correctiveActions: {
          include: {
            assignedTo: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!nonConformance) {
      throw new NotFoundError('Non-conformance not found');
    }

    // Get user's scope IDs
    const userScopeIds = await scopeService.getUserScopeIds(user.userId);

    // Scope-based authorization check
    ScopedAuthorizationPolicies.nonConformance.read().authorize(
      createScopedAuthContext(user, 'read', userScopeIds, {
        scopeId: nonConformance.scopeId,
        reportedById: nonConformance.reportedById,
      })
    );

    return nonConformance;
  }

  /**
   * Update NonConformance with scope check
   */
  async updateNonConformance(
    id: string,
    input: UpdateNonConformanceInput,
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);

    const nonConformance = await prisma.nonConformance.findUnique({
      where: { id },
    });

    if (!nonConformance) {
      throw new NotFoundError('Non-conformance not found');
    }

    // Get user's scope IDs
    const userScopeIds = await scopeService.getUserScopeIds(user.userId);

    // Resource-based + scope-based authorization
    ScopedAuthorizationPolicies.nonConformance.update().authorize(
      createScopedAuthContext(user, 'update', userScopeIds, {
        reportedById: nonConformance.reportedById,
        scopeId: nonConformance.scopeId,
      })
    );

    return prisma.nonConformance.update({
      where: { id },
      data: input,
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        scope: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Close NonConformance with scope check
   */
  async closeNonConformance(id: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    const nonConformance = await prisma.nonConformance.findUnique({
      where: { id },
    });

    if (!nonConformance) {
      throw new NotFoundError('Non-conformance not found');
    }

    if (nonConformance.status === 'CLOSED') {
      throw new ValidationError('Non-conformance is already closed');
    }

    // Get user's scope IDs
    const userScopeIds = await scopeService.getUserScopeIds(user.userId);

    // Resource-based + scope-based authorization
    ScopedAuthorizationPolicies.nonConformance.update().authorize(
      createScopedAuthContext(user, 'update', userScopeIds, {
        reportedById: nonConformance.reportedById,
        scopeId: nonConformance.scopeId,
      })
    );

    return prisma.nonConformance.update({
      where: { id },
      data: { status: 'CLOSED' },
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        scope: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get NonConformances by scope (useful for reporting)
   */
  async getNonConformancesByScope(scopeId: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Get user's scope IDs
    const userScopeIds = await scopeService.getUserScopeIds(user.userId);

    // Validate user has access to this scope
    if (user.role !== 'ADMIN' && !userScopeIds.includes(scopeId)) {
      throw new ValidationError('You do not have access to this scope');
    }

    return prisma.nonConformance.findMany({
      where: { scopeId },
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            correctiveActions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get statistics for user's accessible scopes
   */
  async getScopeStatistics(currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Get user's scope IDs
    const userScopeIds = await scopeService.getUserScopeIds(user.userId);

    // Build scope filter
    const scopeFilter = buildScopeFilter(user, userScopeIds);

    // Get statistics grouped by scope
    const stats = await prisma.nonConformance.groupBy({
      by: ['scopeId', 'status'],
      where: scopeFilter,
      _count: true,
    });

    // Get scope names
    const scopes = await prisma.scope.findMany({
      where: scopeFilter,
      select: {
        id: true,
        name: true,
      },
    });

    // Format results
    const scopeMap = new Map(scopes.map((s) => [s.id, s.name]));

    return stats.map((stat) => ({
      scopeId: stat.scopeId,
      scopeName: scopeMap.get(stat.scopeId) || 'Unknown',
      status: stat.status,
      count: stat._count,
    }));
  }
}

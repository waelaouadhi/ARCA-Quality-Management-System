/**
 * SCOPE MANAGEMENT SERVICE
 * 
 * Handles scope CRUD operations and user-scope assignments
 */

import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';
import { JWTPayload } from '@/shared/utils/jwt';
import { PrismaClient } from '@prisma/client';
import {
  requireAuthentication,
  ScopedAuthorizationPolicies,
  createScopedAuthContext,
} from '@/shared/utils/scopedAuthorization';

const prisma = new PrismaClient();

export interface CreateScopeInput {
  name: string;
  description?: string;
}

export interface UpdateScopeInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AssignUserToScopeInput {
  userId: string;
  scopeId: string;
}

export class ScopeService {
  /**
   * Create a new scope (ADMIN only)
   */
  async createScope(input: CreateScopeInput, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Authorization check
    ScopedAuthorizationPolicies.scope.create().authorize(
      createScopedAuthContext(user, 'create', [])
    );

    // Check if scope name already exists
    const existing = await prisma.scope.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ValidationError(`Scope with name "${input.name}" already exists`);
    }

    return prisma.scope.create({
      data: {
        name: input.name,
        description: input.description,
      },
    });
  }

  /**
   * Get all scopes (ADMIN and MANAGER)
   */
  async getScopes(currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Authorization check
    ScopedAuthorizationPolicies.scope.read().authorize(
      createScopedAuthContext(user, 'read', [])
    );

    return prisma.scope.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            users: true,
            nonConformances: true,
            documents: true,
            correctiveActions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get scope by ID
   */
  async getScopeById(id: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Authorization check
    ScopedAuthorizationPolicies.scope.read().authorize(
      createScopedAuthContext(user, 'read', [])
    );

    const scope = await prisma.scope.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            nonConformances: true,
            documents: true,
            correctiveActions: true,
          },
        },
      },
    });

    if (!scope) {
      throw new NotFoundError('Scope not found');
    }

    return scope;
  }

  /**
   * Update scope (ADMIN only)
   */
  async updateScope(id: string, input: UpdateScopeInput, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Authorization check
    ScopedAuthorizationPolicies.scope.update().authorize(
      createScopedAuthContext(user, 'update', [])
    );

    // Check if scope exists
    const scope = await prisma.scope.findUnique({ where: { id } });
    if (!scope) {
      throw new NotFoundError('Scope not found');
    }

    // Check name uniqueness if changing name
    if (input.name && input.name !== scope.name) {
      const existing = await prisma.scope.findUnique({
        where: { name: input.name },
      });
      if (existing) {
        throw new ValidationError(`Scope with name "${input.name}" already exists`);
      }
    }

    return prisma.scope.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete scope (ADMIN only)
   * Note: This will fail if scope has associated resources
   */
  async deleteScope(id: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Authorization check
    ScopedAuthorizationPolicies.scope.delete().authorize(
      createScopedAuthContext(user, 'delete', [])
    );

    const scope = await prisma.scope.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            nonConformances: true,
            documents: true,
            correctiveActions: true,
          },
        },
      },
    });

    if (!scope) {
      throw new NotFoundError('Scope not found');
    }

    // Check if scope has resources
    const hasResources =
      scope._count.nonConformances > 0 ||
      scope._count.documents > 0 ||
      scope._count.correctiveActions > 0;

    if (hasResources) {
      throw new ValidationError(
        'Cannot delete scope with associated resources. Please reassign or delete resources first.'
      );
    }

    return prisma.scope.delete({
      where: { id },
    });
  }

  /**
   * Assign user to scope (ADMIN only)
   */
  async assignUserToScope(input: AssignUserToScopeInput, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Authorization check
    ScopedAuthorizationPolicies.scope.assignUser().authorize(
      createScopedAuthContext(user, 'update', [])
    );

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
    });
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Verify scope exists
    const scope = await prisma.scope.findUnique({
      where: { id: input.scopeId },
    });
    if (!scope) {
      throw new NotFoundError('Scope not found');
    }

    // Check if already assigned
    const existing = await prisma.userScope.findUnique({
      where: {
        userId_scopeId: {
          userId: input.userId,
          scopeId: input.scopeId,
        },
      },
    });

    if (existing) {
      throw new ValidationError('User is already assigned to this scope');
    }

    return prisma.userScope.create({
      data: {
        userId: input.userId,
        scopeId: input.scopeId,
      },
      include: {
        user: {
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
   * Remove user from scope (ADMIN only)
   */
  async removeUserFromScope(userId: string, scopeId: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Authorization check
    ScopedAuthorizationPolicies.scope.assignUser().authorize(
      createScopedAuthContext(user, 'update', [])
    );

    const userScope = await prisma.userScope.findUnique({
      where: {
        userId_scopeId: {
          userId,
          scopeId,
        },
      },
    });

    if (!userScope) {
      throw new NotFoundError('User scope assignment not found');
    }

    return prisma.userScope.delete({
      where: {
        userId_scopeId: {
          userId,
          scopeId,
        },
      },
    });
  }

  /**
   * Get user's scopes
   */
  async getUserScopes(userId: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Users can view their own scopes, ADMIN/MANAGER can view anyone's
    if (user.userId !== userId && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      throw new AuthorizationError('Cannot view other users scopes');
    }

    return prisma.userScope.findMany({
      where: { userId },
      include: {
        scope: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Get scope IDs for a user (optimized query)
   * Used frequently for authorization checks
   */
  async getUserScopeIds(userId: string): Promise<string[]> {
    const userScopes = await prisma.userScope.findMany({
      where: { userId },
      select: { scopeId: true },
    });

    return userScopes.map((us) => us.scopeId);
  }

  /**
   * Bulk assign users to scope
   */
  async bulkAssignUsersToScope(
    scopeId: string,
    userIds: string[],
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);

    // Authorization check
    ScopedAuthorizationPolicies.scope.assignUser().authorize(
      createScopedAuthContext(user, 'update', [])
    );

    // Verify scope exists
    const scope = await prisma.scope.findUnique({ where: { id: scopeId } });
    if (!scope) {
      throw new NotFoundError('Scope not found');
    }

    // Create assignments (skip existing ones)
    const results = await prisma.$transaction(
      userIds.map((userId) =>
        prisma.userScope.upsert({
          where: {
            userId_scopeId: {
              userId,
              scopeId,
            },
          },
          create: {
            userId,
            scopeId,
          },
          update: {}, // No-op if already exists
        })
      )
    );

    return results;
  }
}

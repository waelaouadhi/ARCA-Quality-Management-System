import { AuthorizationError } from '@/shared/errors';
import { JWTPayload } from './jwt';
import type { Role } from './permissions';

export interface ResourceOwnership {
  createdById?: string | null;
  reportedById?: string | null;
  assignedToId?: string | null;
}

// NEW: Extended to include scope information
export interface ScopedResource extends ResourceOwnership {
  scopeId?: string | null;
}

export interface AuthorizationContext {
  user: JWTPayload;
  resource?: ResourceOwnership;
  action: 'create' | 'read' | 'update' | 'delete';
}

// NEW: Extended authorization context with scope support
export interface ScopedAuthorizationContext extends AuthorizationContext {
  resource?: ScopedResource;
  userScopeIds?: string[]; // User's scope IDs
}

/**
 * Check if user is authenticated
 */
export function requireAuthentication(user?: JWTPayload): JWTPayload {
  if (!user) {
    throw new AuthorizationError('Authentication required');
  }
  return user;
}

/**
 * Check if user has one of the specified roles
 */
export function requireRole(user: JWTPayload, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(user.role as Role)) {
    throw new AuthorizationError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }
}

/**
 * Check if user is ADMIN
 */
export function isAdmin(user: JWTPayload): boolean {
  return user.role === 'ADMIN';
}

/**
 * Check if user is MANAGER or ADMIN
 */
export function isManagerOrAbove(user: JWTPayload): boolean {
  return user.role === 'ADMIN' || user.role === 'MANAGER';
}

/**
 * Check if user created the resource
 */
export function isResourceCreator(user: JWTPayload, resource: ResourceOwnership): boolean {
  return !!(
    resource &&
    ((resource.createdById && resource.createdById === user.userId) ||
      (resource.reportedById && resource.reportedById === user.userId))
  );
}

/**
 * Check if user is assigned to the resource
 */
export function isResourceAssignee(user: JWTPayload, resource: ResourceOwnership): boolean {
  return !!(resource && resource.assignedToId && resource.assignedToId === user.userId);
}

/**
 * Check if user has any relationship to the resource
 */
export function hasResourceRelationship(user: JWTPayload, resource: ResourceOwnership): boolean {
  return isResourceCreator(user, resource) || isResourceAssignee(user, resource);
}

// ============================================================================
// SCOPE-BASED AUTHORIZATION (NEW)
// ============================================================================

/**
 * Check if user has access to the resource's scope
 * ADMIN bypasses scope restrictions
 */
export function hasAccessToScope(userScopeIds: string[], resourceScopeId: string): boolean {
  if (!resourceScopeId) {
    return false; // Resource must have a scope
  }
  return userScopeIds.includes(resourceScopeId);
}

/**
 * Check if user has access to ANY of the given scopes
 * Used for multi-scope queries
 */
export function hasAccessToAnyScope(userScopeIds: string[], targetScopeIds: string[]): boolean {
  return targetScopeIds.some(scopeId => userScopeIds.includes(scopeId));
}

/**
 * Require user to have access to specific scope
 * ADMIN bypasses this check
 */
export function requireScopeAccess(
  user: JWTPayload,
  userScopeIds: string[],
  resourceScopeId: string
): void {
  // ADMIN bypasses scope restrictions
  if (isAdmin(user)) {
    return;
  }

  if (!hasAccessToScope(userScopeIds, resourceScopeId)) {
    throw new AuthorizationError('Access denied: insufficient scope permissions');
  }
}

/**
 * Get scope IDs accessible by user
 * For ADMIN, returns null (indicating all scopes accessible)
 * For other users, returns their assigned scope IDs
 */
export function getAccessibleScopeIds(user: JWTPayload, userScopeIds: string[]): string[] | null {
  // ADMIN can access all scopes
  if (isAdmin(user)) {
    return null;
  }

  // Return user's scope IDs
  return userScopeIds;
}

/**
 * Filter scope IDs that user has access to
 */
export function filterAccessibleScopes(
  user: JWTPayload,
  userScopeIds: string[],
  requestedScopeIds: string[]
): string[] {
  // ADMIN can access all requested scopes
  if (isAdmin(user)) {
    return requestedScopeIds;
  }

  // Filter to only scopes user has access to
  return requestedScopeIds.filter(scopeId => userScopeIds.includes(scopeId));
}

/**
 * Authorization rule builder with scope support
 */
export class ScopedAuthorizationRule {
  private rules: Array<(ctx: ScopedAuthorizationContext) => boolean> = [];

  /**
   * Allow ADMIN users (bypasses all checks including scope)
   */
  allowAdmin(): this {
    this.rules.push((ctx) => isAdmin(ctx.user));
    return this;
  }

  /**
   * Allow MANAGER and ADMIN users
   */
  allowManagerOrAbove(): this {
    this.rules.push((ctx) => isManagerOrAbove(ctx.user));
    return this;
  }

  /**
   * Allow users with specific roles
   */
  allowRoles(roles: Role[]): this {
    this.rules.push((ctx) => roles.includes(ctx.user.role as Role));
    return this;
  }

  /**
   * Allow resource creator (with scope check)
   */
  allowCreator(): this {
    this.rules.push((ctx) => {
      if (!ctx.resource) return false;

      const isCreator = isResourceCreator(ctx.user, ctx.resource);
      if (!isCreator) return false;

      // ADMIN bypasses scope check
      if (isAdmin(ctx.user)) return true;

      // Check scope access
      if (ctx.resource.scopeId && ctx.userScopeIds) {
        return hasAccessToScope(ctx.userScopeIds, ctx.resource.scopeId);
      }

      return false;
    });
    return this;
  }

  /**
   * Allow resource assignee (with scope check)
   */
  allowAssignee(): this {
    this.rules.push((ctx) => {
      if (!ctx.resource) return false;

      const isAssignee = isResourceAssignee(ctx.user, ctx.resource);
      if (!isAssignee) return false;

      // ADMIN bypasses scope check
      if (isAdmin(ctx.user)) return true;

      // Check scope access
      if (ctx.resource.scopeId && ctx.userScopeIds) {
        return hasAccessToScope(ctx.userScopeIds, ctx.resource.scopeId);
      }

      return false;
    });
    return this;
  }

  /**
   * Allow if user has scope access (regardless of ownership)
   * Useful for read operations where scope membership is sufficient
   */
  allowScopeAccess(): this {
    this.rules.push((ctx) => {
      // ADMIN bypasses scope check
      if (isAdmin(ctx.user)) return true;

      if (ctx.resource?.scopeId && ctx.userScopeIds) {
        return hasAccessToScope(ctx.userScopeIds, ctx.resource.scopeId);
      }

      return false;
    });
    return this;
  }

  /**
   * Custom authorization rule
   */
  allow(predicate: (ctx: ScopedAuthorizationContext) => boolean): this {
    this.rules.push(predicate);
    return this;
  }

  /**
   * Evaluate authorization rules (OR logic - any rule passes = authorized)
   */
  authorize(ctx: ScopedAuthorizationContext): void {
    if (this.rules.length === 0) {
      throw new AuthorizationError('No authorization rules defined');
    }

    const authorized = this.rules.some((rule) => rule(ctx));

    if (!authorized) {
      throw new AuthorizationError('Insufficient permissions for this action');
    }
  }

  /**
   * Check authorization without throwing (returns boolean)
   */
  check(ctx: ScopedAuthorizationContext): boolean {
    if (this.rules.length === 0) {
      return false;
    }
    return this.rules.some((rule) => rule(ctx));
  }
}

/**
 * Pre-defined scoped authorization policies
 */
export const ScopedAuthorizationPolicies = {
  /**
   * NonConformance with scope support
   */
  nonConformance: {
    create: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove()
        .allowScopeAccess(), // Users can create in their scopes

    read: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowScopeAccess(), // Users can read resources in their scopes

    update: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove()
        .allowCreator(), // Users can update their own reports in their scopes

    delete: () =>
      new ScopedAuthorizationRule().allowAdmin(),
  },

  /**
   * CorrectiveAction with scope support
   */
  correctiveAction: {
    create: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove(), // Only managers can create (with scope check)

    read: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowScopeAccess(), // Users can read actions in their scopes

    update: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove()
        .allowAssignee(), // Users can update assigned actions in their scopes

    delete: () =>
      new ScopedAuthorizationRule().allowAdmin(),
  },

  /**
   * Document with scope support
   */
  document: {
    create: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove(), // Only managers can create documents

    read: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowScopeAccess(), // Users can read documents in their scopes

    update: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove()
        .allowCreator(), // Users can update documents they created in their scopes

    delete: () =>
      new ScopedAuthorizationRule().allowAdmin(),
  },

  /**
   * Scope management
   */
  scope: {
    create: () =>
      new ScopedAuthorizationRule().allowAdmin(),

    read: () =>
      new ScopedAuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove(),

    update: () =>
      new ScopedAuthorizationRule().allowAdmin(),

    delete: () =>
      new ScopedAuthorizationRule().allowAdmin(),

    assignUser: () =>
      new ScopedAuthorizationRule().allowAdmin(),
  },
};

/**
 * Helper to create scoped authorization context
 */
export function createScopedAuthContext(
  user: JWTPayload,
  action: ScopedAuthorizationContext['action'],
  userScopeIds: string[],
  resource?: ScopedResource
): ScopedAuthorizationContext {
  return { user, action, resource, userScopeIds };
}

/**
 * Build Prisma where clause for scope filtering
 */
export function buildScopeFilter(user: JWTPayload, userScopeIds: string[]) {
  // ADMIN can see all scopes
  if (isAdmin(user)) {
    return {};
  }

  // Filter by user's scopes
  if (userScopeIds.length === 0) {
    // User has no scopes - return filter that matches nothing
    return { scopeId: 'no-access' };
  }

  return {
    scopeId: {
      in: userScopeIds,
    },
  };
}

/**
 * Validate that user can create resource in the specified scope
 */
export function validateScopeForCreate(
  user: JWTPayload,
  userScopeIds: string[],
  targetScopeId: string
): void {
  // ADMIN can create in any scope
  if (isAdmin(user)) {
    return;
  }

  if (!userScopeIds.includes(targetScopeId)) {
    throw new AuthorizationError('Cannot create resource in this scope');
  }
}

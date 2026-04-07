import { AuthorizationError } from '@/shared/errors';
import { JWTPayload } from './jwt';

type Role = 'ADMIN' | 'MANAGER' | 'USER';

export interface ResourceOwnership {
  createdById?: string | null;
  reportedById?: string | null;
  assignedToId?: string | null;
}

export interface AuthorizationContext {
  user: JWTPayload;
  resource?: ResourceOwnership;
  action: 'create' | 'read' | 'update' | 'delete';
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

/**
 * Authorization rule builder for resource-based access control
 */
export class AuthorizationRule {
  private rules: Array<(ctx: AuthorizationContext) => boolean> = [];

  /**
   * Allow ADMIN users
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
   * Allow resource creator
   */
  allowCreator(): this {
    this.rules.push((ctx) => (ctx.resource ? isResourceCreator(ctx.user, ctx.resource) : false));
    return this;
  }

  /**
   * Allow resource assignee
   */
  allowAssignee(): this {
    this.rules.push((ctx) => (ctx.resource ? isResourceAssignee(ctx.user, ctx.resource) : false));
    return this;
  }

  /**
   * Allow if user has any relationship to resource
   */
  allowRelatedUser(): this {
    this.rules.push((ctx) => (ctx.resource ? hasResourceRelationship(ctx.user, ctx.resource) : false));
    return this;
  }

  /**
   * Custom authorization rule
   */
  allow(predicate: (ctx: AuthorizationContext) => boolean): this {
    this.rules.push(predicate);
    return this;
  }

  /**
   * Evaluate authorization rules (OR logic - any rule passes = authorized)
   */
  authorize(ctx: AuthorizationContext): void {
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
  check(ctx: AuthorizationContext): boolean {
    if (this.rules.length === 0) {
      return false;
    }
    return this.rules.some((rule) => rule(ctx));
  }
}

/**
 * Pre-defined authorization policies
 */
export const AuthorizationPolicies = {
  /**
   * NonConformance authorization:
   * - ADMIN/MANAGER: full access
   * - USER: can update their own reports
   */
  nonConformance: {
    create: () =>
      new AuthorizationRule().allowAdmin().allowManagerOrAbove().allowRoles(['USER']),

    read: () =>
      new AuthorizationRule().allowAdmin().allowManagerOrAbove().allowRoles(['USER']),

    update: () =>
      new AuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove()
        .allowCreator(), // Users can update their own reports

    delete: () =>
      new AuthorizationRule().allowAdmin(),
  },

  /**
   * CorrectiveAction authorization:
   * - ADMIN/MANAGER: full access
   * - USER: can update actions assigned to them
   */
  correctiveAction: {
    create: () =>
      new AuthorizationRule().allowAdmin().allowManagerOrAbove(),

    read: () =>
      new AuthorizationRule().allowAdmin().allowManagerOrAbove().allowRoles(['USER']),

    update: () =>
      new AuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove()
        .allowAssignee(), // Users can update assigned actions

    delete: () =>
      new AuthorizationRule().allowAdmin(),
  },

  /**
   * Document authorization:
   * - ADMIN/MANAGER: full access
   * - USER: can update documents they created (if in DRAFT status)
   */
  document: {
    create: () =>
      new AuthorizationRule().allowAdmin().allowManagerOrAbove(),

    read: () =>
      new AuthorizationRule().allowAdmin().allowManagerOrAbove().allowRoles(['USER']),

    update: () =>
      new AuthorizationRule()
        .allowAdmin()
        .allowManagerOrAbove()
        .allowCreator(), // Users can update their own documents

    delete: () =>
      new AuthorizationRule().allowAdmin(),
  },

  /**
   * User management authorization
   */
  user: {
    create: () =>
      new AuthorizationRule().allowAdmin(),

    read: () =>
      new AuthorizationRule().allowAdmin().allowManagerOrAbove(),

    update: () =>
      new AuthorizationRule()
        .allowAdmin()
        .allow((ctx) => ctx.user.userId === ctx.resource?.createdById), // Users can update themselves

    delete: () =>
      new AuthorizationRule().allowAdmin(),
  },
};

/**
 * Helper to create authorization context
 */
export function createAuthContext(
  user: JWTPayload,
  action: AuthorizationContext['action'],
  resource?: ResourceOwnership
): AuthorizationContext {
  return { user, action, resource };
}

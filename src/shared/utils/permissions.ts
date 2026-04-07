import { AuthorizationError } from '@/shared/errors';
import { JWTPayload } from './jwt';

/**
 * Fine-Grained Permission System
 * 
 * This module provides action-based permissions beyond basic CRUD.
 * Each resource has specific actions that different roles can perform.
 * 
 * Example actions:
 * - document:create, document:approve, document:archive
 * - nc:create, nc:assign, nc:investigate, nc:close
 * - ca:create, ca:assign, ca:complete, ca:verify
 */

// ============================================================================
// Types & Constants
// ============================================================================

export type Role = 'ADMIN' | 'MANAGER' | 'USER';

/**
 * Resource types in the QMS system
 */
export enum Resource {
  // Core resources
  NON_CONFORMANCE = 'nonConformance',
  CORRECTIVE_ACTION = 'correctiveAction',
  DOCUMENT = 'document',
  USER = 'user',
  SCOPE = 'scope',
  
  // Additional resources
  AUDIT = 'audit',
  TRAINING = 'training',
  SUPPLIER = 'supplier',
}

/**
 * Fine-grained actions that can be performed on resources
 */
export enum Action {
  // Basic CRUD
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  
  // Listing & Search
  LIST = 'list',
  SEARCH = 'search',
  
  // Assignment & Ownership
  ASSIGN = 'assign',
  REASSIGN = 'reassign',
  CLAIM = 'claim',
  
  // Workflow actions
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  REVIEW = 'review',
  VERIFY = 'verify',
  
  // Status changes
  CLOSE = 'close',
  REOPEN = 'reopen',
  CANCEL = 'cancel',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  
  // Investigation & Analysis
  INVESTIGATE = 'investigate',
  ANALYZE = 'analyze',
  
  // Completion
  COMPLETE = 'complete',
  MARK_COMPLETE = 'markComplete',
  
  // Administrative
  EXPORT = 'export',
  IMPORT = 'import',
  BULK_UPDATE = 'bulkUpdate',
  MANAGE_SETTINGS = 'manageSettings',
}

/**
 * Permission format: "resource:action"
 * Examples: "document:approve", "nonConformance:assign"
 */
export type Permission = `${Resource}:${Action}`;

// ============================================================================
// Permission Definitions
// ============================================================================

/**
 * Comprehensive permission map for each role
 * Defines what actions each role can perform on each resource
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  /**
   * ADMIN - Full system access
   */
  ADMIN: [
    // Non-Conformance - all actions
    'nonConformance:create',
    'nonConformance:read',
    'nonConformance:update',
    'nonConformance:delete',
    'nonConformance:list',
    'nonConformance:assign',
    'nonConformance:reassign',
    'nonConformance:investigate',
    'nonConformance:close',
    'nonConformance:reopen',
    'nonConformance:archive',
    'nonConformance:approve',
    'nonConformance:reject',
    'nonConformance:export',
    
    // Corrective Action - all actions
    'correctiveAction:create',
    'correctiveAction:read',
    'correctiveAction:update',
    'correctiveAction:delete',
    'correctiveAction:list',
    'correctiveAction:assign',
    'correctiveAction:reassign',
    'correctiveAction:complete',
    'correctiveAction:verify',
    'correctiveAction:approve',
    'correctiveAction:reject',
    'correctiveAction:export',
    
    // Document - all actions
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'document:list',
    'document:approve',
    'document:reject',
    'document:archive',
    'document:restore',
    'document:export',
    'document:import',
    
    // User management - all actions
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'user:list',
    'user:export',
    
    // Scope management - all actions
    'scope:create',
    'scope:read',
    'scope:update',
    'scope:delete',
    'scope:list',
    'scope:assign',
    
    // Audit - all actions
    'audit:read',
    'audit:list',
    'audit:export',
    
    // System administration
    'nonConformance:bulkUpdate',
    'correctiveAction:bulkUpdate',
    'document:manageSettings',
  ],

  /**
   * MANAGER - Supervisory and approval capabilities
   */
  MANAGER: [
    // Non-Conformance - manage and approve
    'nonConformance:create',
    'nonConformance:read',
    'nonConformance:update',
    'nonConformance:list',
    'nonConformance:assign',
    'nonConformance:reassign',
    'nonConformance:investigate',
    'nonConformance:approve',
    'nonConformance:reject',
    'nonConformance:close',
    'nonConformance:reopen',
    'nonConformance:export',
    
    // Corrective Action - manage and verify
    'correctiveAction:create',
    'correctiveAction:read',
    'correctiveAction:update',
    'correctiveAction:list',
    'correctiveAction:assign',
    'correctiveAction:reassign',
    'correctiveAction:verify',
    'correctiveAction:approve',
    'correctiveAction:reject',
    'correctiveAction:export',
    
    // Document - review and approve
    'document:create',
    'document:read',
    'document:update',
    'document:list',
    'document:approve',
    'document:reject',
    'document:archive',
    'document:export',
    
    // User management - limited
    'user:read',
    'user:list',
    'user:update', // Can update user assignments
    
    // Scope - read access
    'scope:read',
    'scope:list',
    
    // Audit - read access
    'audit:read',
    'audit:list',
    'audit:export',
  ],

  /**
   * USER - Basic operational permissions
   */
  USER: [
    // Non-Conformance - create and manage own
    'nonConformance:create',
    'nonConformance:read',
    'nonConformance:update', // Only own or assigned
    'nonConformance:list',
    'nonConformance:investigate', // Own reports
    'nonConformance:submit',
    
    // Corrective Action - work on assigned
    'correctiveAction:read',
    'correctiveAction:update', // Only assigned
    'correctiveAction:list',
    'correctiveAction:complete', // Mark as complete
    
    // Document - basic access
    'document:create',
    'document:read',
    'document:update', // Only own
    'document:list',
    'document:submit',
    
    // User - self management
    'user:read',
    'user:update', // Only own profile
    
    // Scope - read only
    'scope:read',
    'scope:list',
  ],
};

/**
 * Permission aliases for common permission groups
 * Makes it easier to check for related permissions
 */
export const PERMISSION_GROUPS = {
  // Can manage Non-Conformances
  NC_MANAGER: [
    'nonConformance:assign',
    'nonConformance:reassign',
    'nonConformance:close',
  ] as Permission[],
  
  // Can approve documents
  DOCUMENT_APPROVER: [
    'document:approve',
    'document:reject',
  ] as Permission[],
  
  // Can verify corrective actions
  CA_VERIFIER: [
    'correctiveAction:verify',
    'correctiveAction:approve',
    'correctiveAction:reject',
  ] as Permission[],
  
  // System administrators
  SYSTEM_ADMIN: [
    'user:create',
    'user:delete',
    'scope:create',
    'scope:delete',
  ] as Permission[],
};

// ============================================================================
// Permission Check Functions
// ============================================================================

/**
 * Check if a role has a specific permission
 * 
 * @param role - User role to check
 * @param permission - Permission string (e.g., "document:approve")
 * @returns true if role has permission
 * 
 * @example
 * hasPermission('MANAGER', 'document:approve') // true
 * hasPermission('USER', 'document:approve') // false
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has a specific permission (uses JWTPayload)
 * 
 * @param user - Authenticated user from JWT
 * @param permission - Permission to check
 * @returns true if user has permission
 * 
 * @example
 * const user = { id: '1', role: 'MANAGER', email: 'mgr@example.com' };
 * userHasPermission(user, 'document:approve') // true
 */
export function userHasPermission(user: JWTPayload, permission: Permission): boolean {
  return hasPermission(user.role as Role, permission);
}

/**
 * Check if user has ALL of the specified permissions
 * 
 * @param user - Authenticated user
 * @param permissions - Array of permissions to check
 * @returns true if user has all permissions
 * 
 * @example
 * userHasAllPermissions(user, ['document:create', 'document:approve'])
 */
export function userHasAllPermissions(user: JWTPayload, permissions: Permission[]): boolean {
  const role = user.role as Role;
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if user has ANY of the specified permissions
 * 
 * @param user - Authenticated user
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one permission
 * 
 * @example
 * userHasAnyPermission(user, ['document:approve', 'document:reject'])
 */
export function userHasAnyPermission(user: JWTPayload, permissions: Permission[]): boolean {
  const role = user.role as Role;
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Require user to have a specific permission, throw error if not
 * 
 * @param user - Authenticated user
 * @param permission - Required permission
 * @throws AuthorizationError if user lacks permission
 * 
 * @example
 * requirePermission(user, 'document:approve');
 */
export function requirePermission(user: JWTPayload, permission: Permission): void {
  if (!userHasPermission(user, permission)) {
    throw new AuthorizationError(
      `Permission denied: '${permission}' required`
    );
  }
}

/**
 * Require user to have ALL specified permissions
 * 
 * @param user - Authenticated user
 * @param permissions - Required permissions
 * @throws AuthorizationError if user lacks any permission
 */
export function requireAllPermissions(user: JWTPayload, permissions: Permission[]): void {
  const missingPermissions = permissions.filter(
    permission => !userHasPermission(user, permission)
  );
  
  if (missingPermissions.length > 0) {
    throw new AuthorizationError(
      `Permission denied: missing ${missingPermissions.join(', ')}`
    );
  }
}

/**
 * Require user to have at least ONE of the specified permissions
 * 
 * @param user - Authenticated user
 * @param permissions - Array of acceptable permissions
 * @throws AuthorizationError if user has none of the permissions
 */
export function requireAnyPermission(user: JWTPayload, permissions: Permission[]): void {
  if (!userHasAnyPermission(user, permissions)) {
    throw new AuthorizationError(
      `Permission denied: one of [${permissions.join(', ')}] required`
    );
  }
}

/**
 * Get all permissions for a role
 * 
 * @param role - Role to get permissions for
 * @returns Array of permissions
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get all permissions for a user
 * 
 * @param user - Authenticated user
 * @returns Array of permissions
 */
export function getUserPermissions(user: JWTPayload): Permission[] {
  return getRolePermissions(user.role as Role);
}

/**
 * Check if user can perform an action on a resource
 * 
 * @param user - Authenticated user
 * @param resource - Resource type
 * @param action - Action to perform
 * @returns true if user can perform action
 * 
 * @example
 * canPerformAction(user, Resource.DOCUMENT, Action.APPROVE)
 */
export function canPerformAction(
  user: JWTPayload,
  resource: Resource,
  action: Action
): boolean {
  const permission = `${resource}:${action}` as Permission;
  return userHasPermission(user, permission);
}

/**
 * Require user to be able to perform an action on a resource
 * 
 * @param user - Authenticated user
 * @param resource - Resource type
 * @param action - Action to perform
 * @throws AuthorizationError if user cannot perform action
 */
export function requireAction(
  user: JWTPayload,
  resource: Resource,
  action: Action
): void {
  const permission = `${resource}:${action}` as Permission;
  requirePermission(user, permission);
}

// ============================================================================
// Permission Query Helpers
// ============================================================================

/**
 * Check if user is an approver for a resource type
 * 
 * @param user - Authenticated user
 * @param resource - Resource to check
 * @returns true if user can approve
 */
export function isApprover(user: JWTPayload, resource: Resource): boolean {
  const permission = `${resource}:${Action.APPROVE}` as Permission;
  return userHasPermission(user, permission);
}

/**
 * Check if user can assign resources
 * 
 * @param user - Authenticated user
 * @param resource - Resource to check
 * @returns true if user can assign
 */
export function canAssign(user: JWTPayload, resource: Resource): boolean {
  const permission = `${resource}:${Action.ASSIGN}` as Permission;
  return userHasPermission(user, permission);
}

/**
 * Check if user can export data
 * 
 * @param user - Authenticated user
 * @param resource - Resource to export
 * @returns true if user can export
 */
export function canExport(user: JWTPayload, resource: Resource): boolean {
  const permission = `${resource}:${Action.EXPORT}` as Permission;
  return userHasPermission(user, permission);
}

/**
 * Check if user is a system administrator
 * Uses permission-based check instead of role check
 * 
 * @param user - Authenticated user
 * @returns true if user has system admin permissions
 */
export function isSystemAdmin(user: JWTPayload): boolean {
  return userHasAllPermissions(user, PERMISSION_GROUPS.SYSTEM_ADMIN);
}

/**
 * Get permission breakdown for a user (for debugging/UI)
 * 
 * @param user - Authenticated user
 * @returns Object with permissions grouped by resource
 */
export function getPermissionBreakdown(user: JWTPayload): Record<string, string[]> {
  const permissions = getUserPermissions(user);
  const breakdown: Record<string, string[]> = {};
  
  permissions.forEach(permission => {
    const [resource, action] = permission.split(':');
    if (!breakdown[resource]) {
      breakdown[resource] = [];
    }
    breakdown[resource].push(action);
  });
  
  return breakdown;
}

// ============================================================================
// Integration with Existing Authorization System
// ============================================================================

/**
 * Enhanced authorization context that includes permission checking
 */
export interface PermissionContext {
  user: JWTPayload;
  resource: Resource;
  action: Action;
  resourceData?: {
    createdById?: string | null;
    assignedToId?: string | null;
    reportedById?: string | null;
  };
}

/**
 * Authorize user action combining permissions and resource ownership
 * 
 * This integrates with the existing resource-based authorization:
 * 1. Check if user has the permission
 * 2. Check resource ownership if applicable
 * 
 * @param context - Permission context
 * @returns true if authorized
 * @throws AuthorizationError if not authorized
 */
export function authorizeAction(context: PermissionContext): boolean {
  const { user, resource, action, resourceData } = context;
  
  // First check: Does user have the permission?
  const permission = `${resource}:${action}` as Permission;
  if (!userHasPermission(user, permission)) {
    throw new AuthorizationError(
      `Permission denied: '${permission}' required for this action`
    );
  }
  
  // Second check: Resource ownership for USER role
  // ADMIN and MANAGER can act on any resource
  if (user.role === 'USER' && resourceData) {
    const isOwner = 
      resourceData.createdById === user.userId ||
      resourceData.reportedById === user.userId ||
      resourceData.assignedToId === user.userId;
    
    if (!isOwner && ![Action.CREATE, Action.LIST, Action.READ].includes(action)) {
      throw new AuthorizationError(
        'You can only modify resources you created or are assigned to'
      );
    }
  }
  
  return true;
}

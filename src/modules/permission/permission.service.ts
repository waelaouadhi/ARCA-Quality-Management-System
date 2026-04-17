import { PrismaClient, Role } from '@prisma/client';
import { PermissionRepository } from './permission.repository';
import { JWTPayload } from '@/shared/utils/jwt';
import { ROLE_PERMISSIONS } from '@/shared/utils/permissions';
import { AuthorizationError } from '@/shared/errors';
import NodeCache from 'node-cache';

export class PermissionService {
  private repository: PermissionRepository;
  private cache: NodeCache;

  constructor(private prisma: PrismaClient) {
    this.repository = new PermissionRepository(prisma);
    // Cache with 1-hour TTL for permission lookups
    this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
  }

  // ============================================================================
  // Permission Seed & Migration
  // ============================================================================

  /**
   * Seed database with default permissions from authorization.ts
   * Run once during Phase 1 migration
   */
  async seedDefaultPermissions(): Promise<void> {
    const existingPerms = await this.repository.getAllPermissions();
    if (existingPerms.length > 0) {
      console.log('Permissions already seeded, skipping...');
      return;
    }

    console.log('Seeding default permissions...');

    // Get all unique permissions from ROLE_PERMISSIONS
    const allPermissions = new Set<string>();
    Object.values(ROLE_PERMISSIONS).forEach((perms) => {
      perms.forEach((p) => allPermissions.add(p));
    });

    // Create each permission
    for (const permStr of allPermissions) {
      const [resource, action] = permStr.split(':');
      await this.repository.createPermission({
        resource,
        action,
        name: permStr,
        description: `${action} on ${resource}`,
        category: this.getPermissionCategory(resource, action),
      });
    }

    console.log(`Seeded ${allPermissions.size} permissions`);
  }

  /**
   * Seed default role-permission mappings
   */
  async seedRolePermissions(): Promise<void> {
    console.log('Seeding role permissions...');

    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      for (const permStr of permissions) {
        const perm = await this.repository.getPermissionByName(permStr);
        if (perm) {
          await this.repository.assignPermissionToRole(role as Role, perm.id);
        }
      }
    }

    console.log('Role permissions seeded');
  }

  // ============================================================================
  // Permission Checking (with Cache)
  // ============================================================================

  /**
   * Check if user has a permission (with database fallback and caching)
   * Uses role permissions first, then checks user-specific overrides
   */
  async userHasPermission(user: JWTPayload, permission: string): Promise<boolean> {
    const cacheKey = `user:${user.userId}:${permission}`;

    // Check cache first
    const cached = this.cache.get<boolean>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Check user-specific denies (denies take precedence)
    const deniedPerms = await this.repository.getUserDeniedPermissions(user.userId);
    if (deniedPerms.includes(permission)) {
      this.cache.set(cacheKey, false);
      return false;
    }

    // Check user-specific grants
    const grantedPerms = await this.repository.getUserGrantedPermissions(user.userId);
    if (grantedPerms.includes(permission)) {
      this.cache.set(cacheKey, true);
      return true;
    }

    // Fall back to role permissions (from database)
    const rolePerms = await this.repository.getRolePermissionNames(user.role as Role);
    const hasPermission = rolePerms.includes(permission);

    this.cache.set(cacheKey, hasPermission);
    return hasPermission;
  }

  /**
   * Require user to have permission (throws if denied)
   */
  async requirePermission(user: JWTPayload, permission: string): Promise<void> {
    const has = await this.userHasPermission(user, permission);
    if (!has) {
      throw new AuthorizationError(`Permission denied: '${permission}' required`);
    }
  }

  /**
   * Get all effective permissions for a user (role + overrides)
   */
  async getUserEffectivePermissions(userId: string, role: Role): Promise<string[]> {
    const cacheKey = `user:${userId}:all-perms`;
    const cached = this.cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get role permissions
    const rolePerms = await this.repository.getRolePermissionNames(role);
    const permSet = new Set(rolePerms);

    // Add user-specific grants
    const grants = await this.repository.getUserGrantedPermissions(userId);
    grants.forEach((p) => permSet.add(p));

    // Remove user-specific denies
    const denies = await this.repository.getUserDeniedPermissions(userId);
    denies.forEach((p) => permSet.delete(p));

    const result = Array.from(permSet);
    this.cache.set(cacheKey, result);
    return result;
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  async grantPermissionToUser(
    userId: string,
    permissionName: string,
    grantedBy: string,
    reason?: string
  ): Promise<void> {
    const permission = await this.repository.getPermissionByName(permissionName);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionName}`);
    }

    await this.repository.grantPermissionToUser(userId, permission.id, {
      reason,
      grantedBy,
    });

    // Invalidate cache
    this.invalidateUserCache(userId);
  }

  async denyPermissionForUser(
    userId: string,
    permissionName: string,
    denyingBy: string,
    reason?: string
  ): Promise<void> {
    const permission = await this.repository.getPermissionByName(permissionName);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionName}`);
    }

    await this.repository.denyPermissionForUser(userId, permission.id, reason, denyingBy);

    // Invalidate cache
    this.invalidateUserCache(userId);
  }

  async removePermissionOverride(userId: string, permissionName: string): Promise<void> {
    const permission = await this.repository.getPermissionByName(permissionName);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionName}`);
    }

    await this.repository.removeUserPermissionOverride(userId, permission.id);

    // Invalidate cache
    this.invalidateUserCache(userId);
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  private invalidateUserCache(userId: string): void {
    const keys = this.cache.keys();
    keys.forEach((key) => {
      if (key.startsWith(`user:${userId}:`)) {
        this.cache.del(key);
      }
    });
  }

  clearAllCache(): void {
    this.cache.flushAll();
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private getPermissionCategory(
    resource: string,
    action: string
  ): 'core' | 'workflow' | 'admin' | 'reporting' {
    const workflowActions = ['approve', 'reject', 'verify', 'submit', 'review'];
    const adminActions = ['create', 'delete', 'bulkUpdate', 'manageSettings', 'import'];
    const reportingActions = ['export', 'search'];

    if (workflowActions.includes(action)) return 'workflow';
    if (adminActions.includes(action)) return 'admin';
    if (reportingActions.includes(action)) return 'reporting';
    return 'core';
  }
}

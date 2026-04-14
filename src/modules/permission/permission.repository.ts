import { PrismaClient, Permission, RolePermission, UserPermission, Role } from '@prisma/client';
import { NotFoundError } from '@/shared/errors';

export class PermissionRepository {
  constructor(private prisma: PrismaClient) {}

  // ============================================================================
  // Permission CRUD
  // ============================================================================

  async createPermission(data: {
    resource: string;
    action: string;
    name: string;
    description?: string;
    category?: string;
  }): Promise<Permission> {
    return this.prisma.permission.create({
      data: {
        resource: data.resource,
        action: data.action,
        name: data.name,
        description: data.description,
        category: data.category || 'general',
        isActive: true,
      },
    });
  }

  async getPermissionById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async getPermissionByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { name },
    });
  }

  async getPermissionByResourceAction(
    resource: string,
    action: string
  ): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
    });
  }

  async getAllPermissions(onlyActive = true): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { resource, isActive: true },
      orderBy: { action: 'asc' },
    });
  }

  async updatePermission(id: string, data: Partial<Permission>): Promise<Permission> {
    const existing = await this.getPermissionById(id);
    if (!existing) throw new NotFoundError(`Permission not found: ${id}`);

    return this.prisma.permission.update({
      where: { id },
      data: {
        description: data.description,
        category: data.category,
        isActive: data.isActive,
      },
    });
  }

  // ============================================================================
  // Role-Permission Mapping
  // ============================================================================

  async assignPermissionToRole(role: Role, permissionId: string): Promise<RolePermission> {
    // Ensure permission exists
    const permission = await this.getPermissionById(permissionId);
    if (!permission) throw new NotFoundError(`Permission not found: ${permissionId}`);

    // Check if already assigned
    const existing = await this.prisma.rolePermission.findUnique({
      where: { role_permissionId: { role, permissionId } },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.rolePermission.create({
      data: {
        role,
        permissionId,
      },
    });
  }

  async removePermissionFromRole(role: Role, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.delete({
      where: { role_permissionId: { role, permissionId } },
    });
  }

  async getRolePermissions(role: Role): Promise<RolePermission[]> {
    return this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });
  }

  async getRolePermissionNames(role: Role): Promise<string[]> {
    const rolePerms = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });
    return rolePerms.map((rp) => rp.permission.name);
  }

  // ============================================================================
  // User-Permission Overrides
  // ============================================================================

  async grantPermissionToUser(
    userId: string,
    permissionId: string,
    options?: {
      reason?: string;
      grantedBy?: string;
      expiresAt?: Date;
    }
  ): Promise<UserPermission> {
    // Ensure permission exists
    const permission = await this.getPermissionById(permissionId);
    if (!permission) throw new NotFoundError(`Permission not found: ${permissionId}`);

    // Check if override already exists
    const existing = await this.prisma.userPermission.findUnique({
      where: { userId_permissionId: { userId, permissionId } },
    });

    if (existing) {
      return this.prisma.userPermission.update({
        where: { userId_permissionId: { userId, permissionId } },
        data: {
          granted: true,
          reason: options?.reason,
          grantedBy: options?.grantedBy,
          expiresAt: options?.expiresAt,
          grantedAt: new Date(),
        },
      });
    }

    return this.prisma.userPermission.create({
      data: {
        userId,
        permissionId,
        granted: true,
        reason: options?.reason,
        grantedBy: options?.grantedBy,
        expiresAt: options?.expiresAt,
      },
    });
  }

  async denyPermissionForUser(
    userId: string,
    permissionId: string,
    reason?: string,
    grantedBy?: string
  ): Promise<UserPermission> {
    const permission = await this.getPermissionById(permissionId);
    if (!permission) throw new NotFoundError(`Permission not found: ${permissionId}`);

    const existing = await this.prisma.userPermission.findUnique({
      where: { userId_permissionId: { userId, permissionId } },
    });

    if (existing) {
      return this.prisma.userPermission.update({
        where: { userId_permissionId: { userId, permissionId } },
        data: {
          granted: false,
          reason,
          grantedBy,
          grantedAt: new Date(),
        },
      });
    }

    return this.prisma.userPermission.create({
      data: {
        userId,
        permissionId,
        granted: false,
        reason,
        grantedBy,
      },
    });
  }

  async getUserPermissionOverrides(userId: string): Promise<UserPermission[]> {
    return this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
  }

  async removeUserPermissionOverride(userId: string, permissionId: string): Promise<void> {
    await this.prisma.userPermission.delete({
      where: { userId_permissionId: { userId, permissionId } },
    });
  }

  async getUserGrantedPermissions(userId: string): Promise<string[]> {
    const overrides = await this.prisma.userPermission.findMany({
      where: { userId, granted: true, expiresAt: { gt: new Date() } },
      include: { permission: true },
    });

    return overrides.map((up) => up.permission.name);
  }

  async getUserDeniedPermissions(userId: string): Promise<string[]> {
    const overrides = await this.prisma.userPermission.findMany({
      where: { userId, granted: false },
      include: { permission: true },
    });

    return overrides.map((up) => up.permission.name);
  }
}

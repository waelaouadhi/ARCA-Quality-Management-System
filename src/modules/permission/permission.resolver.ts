import { PermissionService } from './permission.service';
import prisma from '@/config/database';

const permissionService = new PermissionService(prisma);

export const permissionResolvers = {
  Query: {
    getPermissions: async (_: any, args: any, _context: any) => {
      const { filter = 'ALL' } = args;
      
      if (filter === 'ADMIN') {
        return await prisma.permission.findMany({ where: { resource: 'admin' } });
      }
      
      return await prisma.permission.findMany({ where: { isActive: true } });
    },

    getRolePermissions: async (_: any, args: any, _context: any) => {
      const { role } = args;
      
      return await prisma.rolePermission.findMany({
        where: { role },
        include: { permission: true },
      });
    },

    getUserPermissions: async (_: any, args: any, _context: any) => {
      const { userId } = args;
      
      return await prisma.userPermission.findMany({
        where: { userId, granted: true },
        include: { permission: true },
      });
    },
  },

  Mutation: {
    grantPermissionToUser: async (_: any, args: any, _context: any) => {
      const { userId, permissionId, reason } = args;
      
      return await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId, permissionId } },
        update: { granted: true, grantedAt: new Date() },
        create: {
          userId,
          permissionId,
          granted: true,
          reason,
          grantedBy: _context.user?.userId || 'system',
        },
        include: { permission: true },
      });
    },

    revokePermissionFromUser: async (_: any, args: any, _context: any) => {
      const { userId, permissionId } = args;
      
      return await prisma.userPermission.update({
        where: { userId_permissionId: { userId, permissionId } },
        data: { granted: false },
        include: { permission: true },
      });
    },
  },
};

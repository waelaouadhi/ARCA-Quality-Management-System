import {
  Resource,
  Action,
  Permission,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  hasPermission,
  userHasPermission,
  userHasAllPermissions,
  userHasAnyPermission,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  getRolePermissions,
  getUserPermissions,
  canPerformAction,
  requireAction,
  isApprover,
  canAssign,
  canExport,
  isSystemAdmin,
  getPermissionBreakdown,
  authorizeAction,
} from '@/shared/utils/permissions';
import { JWTPayload } from '@/shared/utils/jwt';

describe('Fine-Grained Permission System', () => {
  // Test users
  const adminUser: JWTPayload = {
    userId: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const managerUser: JWTPayload = {
    userId: 'manager-1',
    email: 'manager@example.com',
    role: 'MANAGER',
  };

  const normalUser: JWTPayload = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'USER',
  };

  describe('Permission Constants', () => {
    it('should have permissions defined for all roles', () => {
      expect(ROLE_PERMISSIONS.ADMIN).toBeDefined();
      expect(ROLE_PERMISSIONS.MANAGER).toBeDefined();
      expect(ROLE_PERMISSIONS.USER).toBeDefined();
    });

    it('should have ADMIN with most permissions', () => {
      expect(ROLE_PERMISSIONS.ADMIN.length).toBeGreaterThan(ROLE_PERMISSIONS.MANAGER.length);
      expect(ROLE_PERMISSIONS.MANAGER.length).toBeGreaterThan(ROLE_PERMISSIONS.USER.length);
    });

    it('should have permission groups defined', () => {
      expect(PERMISSION_GROUPS.NC_MANAGER).toBeDefined();
      expect(PERMISSION_GROUPS.DOCUMENT_APPROVER).toBeDefined();
      expect(PERMISSION_GROUPS.CA_VERIFIER).toBeDefined();
      expect(PERMISSION_GROUPS.SYSTEM_ADMIN).toBeDefined();
    });
  });

  describe('hasPermission', () => {
    it('returns true when role has permission', () => {
      expect(hasPermission('ADMIN', 'document:approve')).toBe(true);
      expect(hasPermission('MANAGER', 'document:approve')).toBe(true);
      expect(hasPermission('USER', 'document:create')).toBe(true);
    });

    it('returns false when role lacks permission', () => {
      expect(hasPermission('USER', 'document:approve')).toBe(false);
      expect(hasPermission('USER', 'nonConformance:assign')).toBe(false);
      expect(hasPermission('USER', 'user:delete')).toBe(false);
    });

    it('ADMIN has all critical permissions', () => {
      expect(hasPermission('ADMIN', 'document:approve')).toBe(true);
      expect(hasPermission('ADMIN', 'nonConformance:close')).toBe(true);
      expect(hasPermission('ADMIN', 'user:delete')).toBe(true);
      expect(hasPermission('ADMIN', 'scope:create')).toBe(true);
    });

    it('MANAGER has approval permissions but not delete', () => {
      expect(hasPermission('MANAGER', 'document:approve')).toBe(true);
      expect(hasPermission('MANAGER', 'nonConformance:approve')).toBe(true);
      expect(hasPermission('MANAGER', 'user:delete')).toBe(false);
      expect(hasPermission('MANAGER', 'scope:delete')).toBe(false);
    });

    it('USER has basic permissions only', () => {
      expect(hasPermission('USER', 'document:create')).toBe(true);
      expect(hasPermission('USER', 'nonConformance:create')).toBe(true);
      expect(hasPermission('USER', 'document:approve')).toBe(false);
      expect(hasPermission('USER', 'nonConformance:assign')).toBe(false);
    });
  });

  describe('userHasPermission', () => {
    it('returns true when user has permission', () => {
      expect(userHasPermission(adminUser, 'document:delete')).toBe(true);
      expect(userHasPermission(managerUser, 'document:approve')).toBe(true);
      expect(userHasPermission(normalUser, 'document:create')).toBe(true);
    });

    it('returns false when user lacks permission', () => {
      expect(userHasPermission(normalUser, 'document:approve')).toBe(false);
      expect(userHasPermission(managerUser, 'user:delete')).toBe(false);
    });
  });

  describe('userHasAllPermissions', () => {
    it('returns true when user has all permissions', () => {
      expect(
        userHasAllPermissions(adminUser, [
          'document:create',
          'document:approve',
          'document:delete',
        ])
      ).toBe(true);

      expect(
        userHasAllPermissions(managerUser, [
          'document:create',
          'document:approve',
        ])
      ).toBe(true);
    });

    it('returns false when user lacks any permission', () => {
      expect(
        userHasAllPermissions(normalUser, [
          'document:create',
          'document:approve',
        ])
      ).toBe(false);

      expect(
        userHasAllPermissions(managerUser, [
          'document:approve',
          'user:delete',
        ])
      ).toBe(false);
    });
  });

  describe('userHasAnyPermission', () => {
    it('returns true when user has at least one permission', () => {
      expect(
        userHasAnyPermission(normalUser, [
          'document:approve',
          'document:create',
        ])
      ).toBe(true);

      expect(
        userHasAnyPermission(managerUser, [
          'user:delete',
          'document:approve',
        ])
      ).toBe(true);
    });

    it('returns false when user has none of the permissions', () => {
      expect(
        userHasAnyPermission(normalUser, [
          'document:approve',
          'user:delete',
          'scope:create',
        ])
      ).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('allows user with permission', () => {
      expect(() =>
        requirePermission(adminUser, 'document:approve')
      ).not.toThrow();

      expect(() =>
        requirePermission(managerUser, 'nonConformance:assign')
      ).not.toThrow();
    });

    it('denies user without permission', () => {
      expect(() =>
        requirePermission(normalUser, 'document:approve')
      ).toThrow();

      expect(() =>
        requirePermission(managerUser, 'user:delete')
      ).toThrow();
    });

    it('throws with descriptive error message', () => {
      expect(() =>
        requirePermission(normalUser, 'document:approve')
      ).toThrow(/document:approve/);
    });
  });

  describe('requireAllPermissions', () => {
    it('allows user with all permissions', () => {
      expect(() =>
        requireAllPermissions(adminUser, [
          'document:create',
          'document:approve',
        ])
      ).not.toThrow();
    });

    it('denies user missing any permission', () => {
      expect(() =>
        requireAllPermissions(normalUser, [
          'document:create',
          'document:approve',
        ])
      ).toThrow();
    });

    it('throws with list of missing permissions', () => {
      expect(() =>
        requireAllPermissions(normalUser, [
          'document:approve',
          'user:delete',
        ])
      ).toThrow(/document:approve.*user:delete/);
    });
  });

  describe('requireAnyPermission', () => {
    it('allows user with at least one permission', () => {
      expect(() =>
        requireAnyPermission(normalUser, [
          'document:approve',
          'document:create',
        ])
      ).not.toThrow();
    });

    it('denies user with none of the permissions', () => {
      expect(() =>
        requireAnyPermission(normalUser, [
          'document:approve',
          'user:delete',
        ])
      ).toThrow();
    });
  });

  describe('getRolePermissions', () => {
    it('returns all permissions for a role', () => {
      const adminPerms = getRolePermissions('ADMIN');
      expect(adminPerms).toContain('document:approve');
      expect(adminPerms).toContain('user:delete');
      expect(adminPerms.length).toBeGreaterThan(30);
    });

    it('returns empty array for invalid role', () => {
      const perms = getRolePermissions('INVALID' as any);
      expect(perms).toEqual([]);
    });
  });

  describe('getUserPermissions', () => {
    it('returns user permissions based on role', () => {
      const perms = getUserPermissions(managerUser);
      expect(perms).toContain('document:approve');
      expect(perms).not.toContain('user:delete');
    });
  });

  describe('canPerformAction', () => {
    it('returns true when user can perform action on resource', () => {
      expect(
        canPerformAction(adminUser, Resource.DOCUMENT, Action.APPROVE)
      ).toBe(true);

      expect(
        canPerformAction(managerUser, Resource.NON_CONFORMANCE, Action.ASSIGN)
      ).toBe(true);
    });

    it('returns false when user cannot perform action', () => {
      expect(
        canPerformAction(normalUser, Resource.DOCUMENT, Action.APPROVE)
      ).toBe(false);

      expect(
        canPerformAction(normalUser, Resource.USER, Action.DELETE)
      ).toBe(false);
    });
  });

  describe('requireAction', () => {
    it('allows user to perform action', () => {
      expect(() =>
        requireAction(adminUser, Resource.DOCUMENT, Action.DELETE)
      ).not.toThrow();
    });

    it('denies user from performing action', () => {
      expect(() =>
        requireAction(normalUser, Resource.DOCUMENT, Action.APPROVE)
      ).toThrow();
    });
  });

  describe('isApprover', () => {
    it('returns true for approvers', () => {
      expect(isApprover(adminUser, Resource.DOCUMENT)).toBe(true);
      expect(isApprover(managerUser, Resource.DOCUMENT)).toBe(true);
      expect(isApprover(managerUser, Resource.NON_CONFORMANCE)).toBe(true);
    });

    it('returns false for non-approvers', () => {
      expect(isApprover(normalUser, Resource.DOCUMENT)).toBe(false);
      expect(isApprover(normalUser, Resource.NON_CONFORMANCE)).toBe(false);
    });
  });

  describe('canAssign', () => {
    it('returns true when user can assign', () => {
      expect(canAssign(adminUser, Resource.NON_CONFORMANCE)).toBe(true);
      expect(canAssign(managerUser, Resource.NON_CONFORMANCE)).toBe(true);
      expect(canAssign(adminUser, Resource.CORRECTIVE_ACTION)).toBe(true);
    });

    it('returns false when user cannot assign', () => {
      expect(canAssign(normalUser, Resource.NON_CONFORMANCE)).toBe(false);
      expect(canAssign(normalUser, Resource.CORRECTIVE_ACTION)).toBe(false);
    });
  });

  describe('canExport', () => {
    it('returns true when user can export', () => {
      expect(canExport(adminUser, Resource.DOCUMENT)).toBe(true);
      expect(canExport(managerUser, Resource.DOCUMENT)).toBe(true);
      expect(canExport(managerUser, Resource.NON_CONFORMANCE)).toBe(true);
    });

    it('returns false when user cannot export', () => {
      expect(canExport(normalUser, Resource.DOCUMENT)).toBe(false);
      expect(canExport(normalUser, Resource.NON_CONFORMANCE)).toBe(false);
    });
  });

  describe('isSystemAdmin', () => {
    it('returns true for ADMIN', () => {
      expect(isSystemAdmin(adminUser)).toBe(true);
    });

    it('returns false for non-admin', () => {
      expect(isSystemAdmin(managerUser)).toBe(false);
      expect(isSystemAdmin(normalUser)).toBe(false);
    });
  });

  describe('getPermissionBreakdown', () => {
    it('returns permissions grouped by resource', () => {
      const breakdown = getPermissionBreakdown(managerUser);
      
      expect(breakdown.document).toBeDefined();
      expect(breakdown.nonConformance).toBeDefined();
      expect(breakdown.document).toContain('approve');
      expect(breakdown.nonConformance).toContain('assign');
    });

    it('includes all resources user has access to', () => {
      const breakdown = getPermissionBreakdown(adminUser);
      
      expect(Object.keys(breakdown).length).toBeGreaterThan(4);
    });
  });

  describe('authorizeAction', () => {
    it('allows action when user has permission', () => {
      expect(() =>
        authorizeAction({
          user: adminUser,
          resource: Resource.DOCUMENT,
          action: Action.APPROVE,
        })
      ).not.toThrow();
    });

    it('denies action when user lacks permission', () => {
      expect(() =>
        authorizeAction({
          user: normalUser,
          resource: Resource.DOCUMENT,
          action: Action.APPROVE,
        })
      ).toThrow();
    });

    it('allows ADMIN to act on any resource', () => {
      expect(() =>
        authorizeAction({
          user: adminUser,
          resource: Resource.DOCUMENT,
          action: Action.UPDATE,
          resourceData: {
            createdById: 'someone-else',
          },
        })
      ).not.toThrow();
    });

    it('allows MANAGER to act on any resource', () => {
      expect(() =>
        authorizeAction({
          user: managerUser,
          resource: Resource.DOCUMENT,
          action: Action.UPDATE,
          resourceData: {
            createdById: 'someone-else',
          },
        })
      ).not.toThrow();
    });

    it('allows USER to act on own resources', () => {
      expect(() =>
        authorizeAction({
          user: normalUser,
          resource: Resource.DOCUMENT,
          action: Action.UPDATE,
          resourceData: {
            createdById: normalUser.userId,
          },
        })
      ).not.toThrow();
    });

    it('denies USER from acting on others resources', () => {
      expect(() =>
        authorizeAction({
          user: normalUser,
          resource: Resource.DOCUMENT,
          action: Action.UPDATE,
          resourceData: {
            createdById: 'someone-else',
          },
        })
      ).toThrow();
    });

    it('allows USER to act on assigned resources', () => {
      expect(() =>
        authorizeAction({
          user: normalUser,
          resource: Resource.CORRECTIVE_ACTION,
          action: Action.UPDATE,
          resourceData: {
            assignedToId: normalUser.userId,
          },
        })
      ).not.toThrow();
    });

    it('allows create and list actions for all users', () => {
      expect(() =>
        authorizeAction({
          user: normalUser,
          resource: Resource.DOCUMENT,
          action: Action.CREATE,
        })
      ).not.toThrow();

      expect(() =>
        authorizeAction({
          user: normalUser,
          resource: Resource.DOCUMENT,
          action: Action.LIST,
        })
      ).not.toThrow();
    });
  });

  describe('Specific Permission Scenarios', () => {
    describe('Document Workflows', () => {
      it('USER can create and update own documents', () => {
        expect(userHasPermission(normalUser, 'document:create')).toBe(true);
        expect(userHasPermission(normalUser, 'document:update')).toBe(true);
      });

      it('MANAGER can approve documents', () => {
        expect(userHasPermission(managerUser, 'document:approve')).toBe(true);
        expect(userHasPermission(managerUser, 'document:reject')).toBe(true);
      });

      it('MANAGER can archive documents', () => {
        expect(userHasPermission(managerUser, 'document:archive')).toBe(true);
      });

      it('Only ADMIN can delete and restore documents', () => {
        expect(userHasPermission(adminUser, 'document:delete')).toBe(true);
        expect(userHasPermission(adminUser, 'document:restore')).toBe(true);
        expect(userHasPermission(managerUser, 'document:delete')).toBe(false);
        expect(userHasPermission(normalUser, 'document:delete')).toBe(false);
      });
    });

    describe('Non-Conformance Workflows', () => {
      it('USER can create and investigate own NCs', () => {
        expect(userHasPermission(normalUser, 'nonConformance:create')).toBe(true);
        expect(userHasPermission(normalUser, 'nonConformance:investigate')).toBe(true);
      });

      it('MANAGER can assign and close NCs', () => {
        expect(userHasPermission(managerUser, 'nonConformance:assign')).toBe(true);
        expect(userHasPermission(managerUser, 'nonConformance:close')).toBe(true);
        expect(userHasPermission(managerUser, 'nonConformance:reassign')).toBe(true);
      });

      it('MANAGER can approve and reject NCs', () => {
        expect(userHasPermission(managerUser, 'nonConformance:approve')).toBe(true);
        expect(userHasPermission(managerUser, 'nonConformance:reject')).toBe(true);
      });

      it('USER cannot assign or close NCs', () => {
        expect(userHasPermission(normalUser, 'nonConformance:assign')).toBe(false);
        expect(userHasPermission(normalUser, 'nonConformance:close')).toBe(false);
      });
    });

    describe('Corrective Action Workflows', () => {
      it('USER can complete assigned CAs', () => {
        expect(userHasPermission(normalUser, 'correctiveAction:complete')).toBe(true);
      });

      it('MANAGER can verify and approve CAs', () => {
        expect(userHasPermission(managerUser, 'correctiveAction:verify')).toBe(true);
        expect(userHasPermission(managerUser, 'correctiveAction:approve')).toBe(true);
      });

      it('MANAGER can assign CAs', () => {
        expect(userHasPermission(managerUser, 'correctiveAction:assign')).toBe(true);
        expect(userHasPermission(managerUser, 'correctiveAction:reassign')).toBe(true);
      });

      it('USER cannot verify or approve CAs', () => {
        expect(userHasPermission(normalUser, 'correctiveAction:verify')).toBe(false);
        expect(userHasPermission(normalUser, 'correctiveAction:approve')).toBe(false);
      });
    });

    describe('User Management', () => {
      it('Only ADMIN can create and delete users', () => {
        expect(userHasPermission(adminUser, 'user:create')).toBe(true);
        expect(userHasPermission(adminUser, 'user:delete')).toBe(true);
        expect(userHasPermission(managerUser, 'user:create')).toBe(false);
        expect(userHasPermission(managerUser, 'user:delete')).toBe(false);
      });

      it('MANAGER can read and update users', () => {
        expect(userHasPermission(managerUser, 'user:read')).toBe(true);
        expect(userHasPermission(managerUser, 'user:update')).toBe(true);
      });

      it('USER can read and update (self)', () => {
        expect(userHasPermission(normalUser, 'user:read')).toBe(true);
        expect(userHasPermission(normalUser, 'user:update')).toBe(true);
      });
    });

    describe('Scope Management', () => {
      it('Only ADMIN can manage scopes', () => {
        expect(userHasPermission(adminUser, 'scope:create')).toBe(true);
        expect(userHasPermission(adminUser, 'scope:delete')).toBe(true);
        expect(userHasPermission(adminUser, 'scope:assign')).toBe(true);
        expect(userHasPermission(managerUser, 'scope:create')).toBe(false);
        expect(userHasPermission(normalUser, 'scope:create')).toBe(false);
      });

      it('All roles can read scopes', () => {
        expect(userHasPermission(adminUser, 'scope:read')).toBe(true);
        expect(userHasPermission(managerUser, 'scope:read')).toBe(true);
        expect(userHasPermission(normalUser, 'scope:read')).toBe(true);
      });
    });

    describe('Export Capabilities', () => {
      it('ADMIN and MANAGER can export', () => {
        expect(userHasPermission(adminUser, 'document:export')).toBe(true);
        expect(userHasPermission(managerUser, 'document:export')).toBe(true);
        expect(userHasPermission(adminUser, 'nonConformance:export')).toBe(true);
        expect(userHasPermission(managerUser, 'nonConformance:export')).toBe(true);
      });

      it('USER cannot export', () => {
        expect(userHasPermission(normalUser, 'document:export')).toBe(false);
        expect(userHasPermission(normalUser, 'nonConformance:export')).toBe(false);
      });
    });

    describe('Bulk Operations', () => {
      it('Only ADMIN can perform bulk operations', () => {
        expect(userHasPermission(adminUser, 'nonConformance:bulkUpdate')).toBe(true);
        expect(userHasPermission(adminUser, 'correctiveAction:bulkUpdate')).toBe(true);
        expect(userHasPermission(managerUser, 'nonConformance:bulkUpdate')).toBe(false);
        expect(userHasPermission(normalUser, 'nonConformance:bulkUpdate')).toBe(false);
      });
    });
  });
});

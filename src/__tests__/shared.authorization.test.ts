import {
  AuthorizationRule,
  AuthorizationPolicies,
  createAuthContext,
  requireAuthentication,
  isAdmin,
  isManagerOrAbove,
  isResourceCreator,
  isResourceAssignee,
  hasResourceRelationship,
} from '@/shared/utils/authorization';
import { JWTPayload } from '@/shared/utils/jwt';
import { AuthorizationError } from '@/shared/errors';

describe('Authorization Utilities', () => {
  const adminUser: JWTPayload = {
    userId: 'admin-id',
    email: 'admin@qms.com',
    role: 'ADMIN',
  };

  const managerUser: JWTPayload = {
    userId: 'manager-id',
    email: 'manager@qms.com',
    role: 'MANAGER',
  };

  const normalUser: JWTPayload = {
    userId: 'user-id',
    email: 'user@qms.com',
    role: 'USER',
  };

  describe('requireAuthentication', () => {
    it('returns user when authenticated', () => {
      const result = requireAuthentication(normalUser);
      expect(result).toEqual(normalUser);
    });

    it('throws when user is undefined', () => {
      expect(() => requireAuthentication(undefined)).toThrow();
    });
  });

  describe('Role checks', () => {
    it('isAdmin identifies admin users', () => {
      expect(isAdmin(adminUser)).toBe(true);
      expect(isAdmin(managerUser)).toBe(false);
      expect(isAdmin(normalUser)).toBe(false);
    });

    it('isManagerOrAbove identifies manager and admin', () => {
      expect(isManagerOrAbove(adminUser)).toBe(true);
      expect(isManagerOrAbove(managerUser)).toBe(true);
      expect(isManagerOrAbove(normalUser)).toBe(false);
    });
  });

  describe('Resource ownership checks', () => {
    it('isResourceCreator identifies creator by createdById', () => {
      const resource = { createdById: 'user-id' };
      expect(isResourceCreator(normalUser, resource)).toBe(true);
      expect(isResourceCreator(managerUser, resource)).toBe(false);
    });

    it('isResourceCreator identifies creator by reportedById', () => {
      const resource = { reportedById: 'user-id' };
      expect(isResourceCreator(normalUser, resource)).toBe(true);
      expect(isResourceCreator(managerUser, resource)).toBe(false);
    });

    it('isResourceAssignee identifies assignee', () => {
      const resource = { assignedToId: 'user-id' };
      expect(isResourceAssignee(normalUser, resource)).toBe(true);
      expect(isResourceAssignee(managerUser, resource)).toBe(false);
    });

    it('hasResourceRelationship identifies any relationship', () => {
      const resource1 = { createdById: 'user-id' };
      const resource2 = { assignedToId: 'user-id' };
      const resource3 = { reportedById: 'user-id' };
      const resource4 = { createdById: 'other-id' };

      expect(hasResourceRelationship(normalUser, resource1)).toBe(true);
      expect(hasResourceRelationship(normalUser, resource2)).toBe(true);
      expect(hasResourceRelationship(normalUser, resource3)).toBe(true);
      expect(hasResourceRelationship(normalUser, resource4)).toBe(false);
    });
  });

  describe('AuthorizationRule', () => {
    it('allows admin users', () => {
      const rule = new AuthorizationRule().allowAdmin();
      const ctx = createAuthContext(adminUser, 'update');

      expect(() => rule.authorize(ctx)).not.toThrow();
    });

    it('denies non-admin users when only admin allowed', () => {
      const rule = new AuthorizationRule().allowAdmin();
      const ctx = createAuthContext(normalUser, 'update');

      expect(() => rule.authorize(ctx)).toThrow();
    });

    it('allows manager and above', () => {
      const rule = new AuthorizationRule().allowManagerOrAbove();

      expect(() => rule.authorize(createAuthContext(adminUser, 'update'))).not.toThrow();
      expect(() => rule.authorize(createAuthContext(managerUser, 'update'))).not.toThrow();
      expect(() => rule.authorize(createAuthContext(normalUser, 'update'))).toThrow();
    });

    it('allows specific roles', () => {
      const rule = new AuthorizationRule().allowRoles(['USER', 'MANAGER']);

      expect(() => rule.authorize(createAuthContext(normalUser, 'update'))).not.toThrow();
      expect(() => rule.authorize(createAuthContext(managerUser, 'update'))).not.toThrow();
      expect(() => rule.authorize(createAuthContext(adminUser, 'update'))).toThrow(); // ADMIN not in list
    });

    it('allows resource creator', () => {
      const rule = new AuthorizationRule().allowCreator();
      const resource = { createdById: 'user-id' };

      expect(() => rule.authorize(createAuthContext(normalUser, 'update', resource))).not.toThrow();
      expect(() => rule.authorize(createAuthContext(managerUser, 'update', resource))).toThrow();
    });

    it('allows resource assignee', () => {
      const rule = new AuthorizationRule().allowAssignee();
      const resource = { assignedToId: 'user-id' };

      expect(() => rule.authorize(createAuthContext(normalUser, 'update', resource))).not.toThrow();
      expect(() => rule.authorize(createAuthContext(managerUser, 'update', resource))).toThrow();
    });

    it('chains multiple rules with OR logic', () => {
      const rule = new AuthorizationRule().allowAdmin().allowCreator();

      const adminCtx = createAuthContext(adminUser, 'update', { createdById: 'other-id' });
      const creatorCtx = createAuthContext(normalUser, 'update', { createdById: 'user-id' });
      const neitherCtx = createAuthContext(normalUser, 'update', { createdById: 'other-id' });

      expect(() => rule.authorize(adminCtx)).not.toThrow();
      expect(() => rule.authorize(creatorCtx)).not.toThrow();
      expect(() => rule.authorize(neitherCtx)).toThrow();
    });

    it('supports custom authorization logic', () => {
      const rule = new AuthorizationRule().allow((ctx) => {
        return ctx.user.email.endsWith('@qms.com');
      });

      const validUser = { userId: '1', email: 'test@qms.com', role: 'USER' };
      const invalidUser = { userId: '2', email: 'test@external.com', role: 'USER' };

      expect(() => rule.authorize(createAuthContext(validUser, 'read'))).not.toThrow();
      expect(() => rule.authorize(createAuthContext(invalidUser, 'read'))).toThrow();
    });

    it('check method returns boolean without throwing', () => {
      const rule = new AuthorizationRule().allowAdmin();

      expect(rule.check(createAuthContext(adminUser, 'update'))).toBe(true);
      expect(rule.check(createAuthContext(normalUser, 'update'))).toBe(false);
    });
  });

  describe('NonConformance Policies', () => {
    it('allows anyone to create NonConformance', () => {
      const policy = AuthorizationPolicies.nonConformance.create();

      expect(() => policy.authorize(createAuthContext(adminUser, 'create'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'create'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'create'))).not.toThrow();
    });

    it('allows anyone to read NonConformance', () => {
      const policy = AuthorizationPolicies.nonConformance.read();

      expect(() => policy.authorize(createAuthContext(adminUser, 'read'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'read'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'read'))).not.toThrow();
    });

    it('allows ADMIN, MANAGER, or creator to update NonConformance', () => {
      const policy = AuthorizationPolicies.nonConformance.update();
      const ownedNC = { reportedById: 'user-id' };
      const othersNC = { reportedById: 'other-id' };

      // Admin can update any
      expect(() => policy.authorize(createAuthContext(adminUser, 'update', othersNC))).not.toThrow();

      // Manager can update any
      expect(() => policy.authorize(createAuthContext(managerUser, 'update', othersNC))).not.toThrow();

      // User can update their own
      expect(() => policy.authorize(createAuthContext(normalUser, 'update', ownedNC))).not.toThrow();

      // User cannot update others
      expect(() => policy.authorize(createAuthContext(normalUser, 'update', othersNC))).toThrow();
    });

    it('allows only ADMIN to delete NonConformance', () => {
      const policy = AuthorizationPolicies.nonConformance.delete();

      expect(() => policy.authorize(createAuthContext(adminUser, 'delete'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'delete'))).toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'delete'))).toThrow();
    });
  });

  describe('CorrectiveAction Policies', () => {
    it('allows only ADMIN and MANAGER to create CorrectiveAction', () => {
      const policy = AuthorizationPolicies.correctiveAction.create();

      expect(() => policy.authorize(createAuthContext(adminUser, 'create'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'create'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'create'))).toThrow();
    });

    it('allows anyone to read CorrectiveAction', () => {
      const policy = AuthorizationPolicies.correctiveAction.read();

      expect(() => policy.authorize(createAuthContext(adminUser, 'read'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'read'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'read'))).not.toThrow();
    });

    it('allows ADMIN, MANAGER, or assignee to update CorrectiveAction', () => {
      const policy = AuthorizationPolicies.correctiveAction.update();
      const assignedAction = { assignedToId: 'user-id' };
      const unassignedAction = { assignedToId: 'other-id' };

      // Admin can update any
      expect(() => policy.authorize(createAuthContext(adminUser, 'update', unassignedAction))).not.toThrow();

      // Manager can update any
      expect(() => policy.authorize(createAuthContext(managerUser, 'update', unassignedAction))).not.toThrow();

      // User can update assigned actions
      expect(() => policy.authorize(createAuthContext(normalUser, 'update', assignedAction))).not.toThrow();

      // User cannot update unassigned actions
      expect(() => policy.authorize(createAuthContext(normalUser, 'update', unassignedAction))).toThrow();
    });

    it('allows only ADMIN to delete CorrectiveAction', () => {
      const policy = AuthorizationPolicies.correctiveAction.delete();

      expect(() => policy.authorize(createAuthContext(adminUser, 'delete'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'delete'))).toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'delete'))).toThrow();
    });
  });

  describe('Document Policies', () => {
    it('allows only ADMIN and MANAGER to create Document', () => {
      const policy = AuthorizationPolicies.document.create();

      expect(() => policy.authorize(createAuthContext(adminUser, 'create'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'create'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'create'))).toThrow();
    });

    it('allows anyone to read Document', () => {
      const policy = AuthorizationPolicies.document.read();

      expect(() => policy.authorize(createAuthContext(adminUser, 'read'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'read'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'read'))).not.toThrow();
    });

    it('allows ADMIN, MANAGER, or creator to update Document', () => {
      const policy = AuthorizationPolicies.document.update();
      const ownedDoc = { createdById: 'user-id' };
      const othersDoc = { createdById: 'other-id' };

      // Admin can update any
      expect(() => policy.authorize(createAuthContext(adminUser, 'update', othersDoc))).not.toThrow();

      // Manager can update any
      expect(() => policy.authorize(createAuthContext(managerUser, 'update', othersDoc))).not.toThrow();

      // User can update their own (though they can't create)
      expect(() => policy.authorize(createAuthContext(normalUser, 'update', ownedDoc))).not.toThrow();

      // User cannot update others
      expect(() => policy.authorize(createAuthContext(normalUser, 'update', othersDoc))).toThrow();
    });

    it('allows only ADMIN to delete Document', () => {
      const policy = AuthorizationPolicies.document.delete();

      expect(() => policy.authorize(createAuthContext(adminUser, 'delete'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'delete'))).toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'delete'))).toThrow();
    });
  });

  describe('User Policies', () => {
    it('allows only ADMIN to create User', () => {
      const policy = AuthorizationPolicies.user.create();

      expect(() => policy.authorize(createAuthContext(adminUser, 'create'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'create'))).toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'create'))).toThrow();
    });

    it('allows ADMIN and MANAGER to read User', () => {
      const policy = AuthorizationPolicies.user.read();

      expect(() => policy.authorize(createAuthContext(adminUser, 'read'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'read'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'read'))).toThrow();
    });

    it('allows ADMIN or self to update User', () => {
      const policy = AuthorizationPolicies.user.update();
      const selfResource = { createdById: 'user-id' };
      const otherResource = { createdById: 'other-id' };

      // Admin can update any
      expect(() => policy.authorize(createAuthContext(adminUser, 'update', otherResource))).not.toThrow();

      // User can update self
      expect(() => policy.authorize(createAuthContext(normalUser, 'update', selfResource))).not.toThrow();

      // User cannot update others
      expect(() => policy.authorize(createAuthContext(normalUser, 'update', otherResource))).toThrow();
    });

    it('allows only ADMIN to delete User', () => {
      const policy = AuthorizationPolicies.user.delete();

      expect(() => policy.authorize(createAuthContext(adminUser, 'delete'))).not.toThrow();
      expect(() => policy.authorize(createAuthContext(managerUser, 'delete'))).toThrow();
      expect(() => policy.authorize(createAuthContext(normalUser, 'delete'))).toThrow();
    });
  });

  describe('Real-world scenarios', () => {
    it('Quality inspector reports NC and updates it', () => {
      const inspector = normalUser;
      const nc = { reportedById: inspector.userId };

      // Can create
      expect(() =>
        AuthorizationPolicies.nonConformance.create().authorize(createAuthContext(inspector, 'create'))
      ).not.toThrow();

      // Can update own report
      expect(() =>
        AuthorizationPolicies.nonConformance.update().authorize(createAuthContext(inspector, 'update', nc))
      ).not.toThrow();
    });

    it('Manager assigns action to technician, technician completes it', () => {
      const technician = normalUser;
      const action = { assignedToId: technician.userId };

      // Manager can create
      expect(() =>
        AuthorizationPolicies.correctiveAction.create().authorize(createAuthContext(managerUser, 'create'))
      ).not.toThrow();

      // Technician can update assigned action
      expect(() =>
        AuthorizationPolicies.correctiveAction.update().authorize(createAuthContext(technician, 'update', action))
      ).not.toThrow();
    });

    it('Manager creates document, later edits it', () => {
      const document = { createdById: managerUser.userId };

      // Can create
      expect(() =>
        AuthorizationPolicies.document.create().authorize(createAuthContext(managerUser, 'create'))
      ).not.toThrow();

      // Can update own document
      expect(() =>
        AuthorizationPolicies.document.update().authorize(createAuthContext(managerUser, 'update', document))
      ).not.toThrow();
    });

    it('Admin overrides any resource', () => {
      const userResource = { createdById: 'user-id', reportedById: 'user-id' };

      // Admin can update any NC
      expect(() =>
        AuthorizationPolicies.nonConformance.update().authorize(createAuthContext(adminUser, 'update', userResource))
      ).not.toThrow();

      // Admin can delete any NC
      expect(() =>
        AuthorizationPolicies.nonConformance.delete().authorize(createAuthContext(adminUser, 'delete'))
      ).not.toThrow();
    });
  });
});

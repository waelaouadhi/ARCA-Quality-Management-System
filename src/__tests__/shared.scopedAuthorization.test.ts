/**
 * Tests for Scope-Based Authorization System
 */

import {
  hasAccessToScope,
  hasAccessToAnyScope,
  requireScopeAccess,
  getAccessibleScopeIds,
  filterAccessibleScopes,
  ScopedAuthorizationRule,
  ScopedAuthorizationPolicies,
  createScopedAuthContext,
  buildScopeFilter,
  validateScopeForCreate,
} from '@/shared/utils/scopedAuthorization';
import { JWTPayload } from '@/shared/utils/jwt';
import { AuthorizationError } from '@/shared/errors';

describe('Scoped Authorization Utilities', () => {
  const adminUser: JWTPayload = {
    userId: 'admin-1',
    email: 'admin@qms.com',
    role: 'ADMIN',
  };

  const managerUser: JWTPayload = {
    userId: 'manager-1',
    email: 'manager@qms.com',
    role: 'MANAGER',
  };

  const normalUser: JWTPayload = {
    userId: 'user-1',
    email: 'user@qms.com',
    role: 'USER',
  };

  const packagingScopeId = 'scope-packaging';
  const productionScopeId = 'scope-production';
  const qualityScopeId = 'scope-quality';

  describe('hasAccessToScope', () => {
    it('returns true when user has access to scope', () => {
      const userScopes = [packagingScopeId, productionScopeId];
      expect(hasAccessToScope(userScopes, packagingScopeId)).toBe(true);
    });

    it('returns false when user does not have access to scope', () => {
      const userScopes = [packagingScopeId];
      expect(hasAccessToScope(userScopes, productionScopeId)).toBe(false);
    });

    it('returns false when scope is null', () => {
      const userScopes = [packagingScopeId];
      expect(hasAccessToScope(userScopes, null as any)).toBe(false);
    });
  });

  describe('hasAccessToAnyScope', () => {
    it('returns true when user has access to at least one scope', () => {
      const userScopes = [packagingScopeId];
      const targetScopes = [packagingScopeId, productionScopeId];
      expect(hasAccessToAnyScope(userScopes, targetScopes)).toBe(true);
    });

    it('returns false when user has no access to any scope', () => {
      const userScopes = [qualityScopeId];
      const targetScopes = [packagingScopeId, productionScopeId];
      expect(hasAccessToAnyScope(userScopes, targetScopes)).toBe(false);
    });
  });

  describe('requireScopeAccess', () => {
    it('allows access when user has the scope', () => {
      const userScopes = [packagingScopeId];
      expect(() =>
        requireScopeAccess(normalUser, userScopes, packagingScopeId)
      ).not.toThrow();
    });

    it('denies access when user does not have the scope', () => {
      const userScopes = [packagingScopeId];
      expect(() =>
        requireScopeAccess(normalUser, userScopes, productionScopeId)
      ).toThrow();
    });

    it('allows ADMIN to access any scope', () => {
      const userScopes: string[] = [];
      expect(() =>
        requireScopeAccess(adminUser, userScopes, productionScopeId)
      ).not.toThrow();
    });
  });

  describe('getAccessibleScopeIds', () => {
    it('returns null for ADMIN (all scopes accessible)', () => {
      const userScopes = [packagingScopeId];
      const result = getAccessibleScopeIds(adminUser, userScopes);
      expect(result).toBeNull();
    });

    it('returns user scope IDs for non-admin users', () => {
      const userScopes = [packagingScopeId, productionScopeId];
      const result = getAccessibleScopeIds(normalUser, userScopes);
      expect(result).toEqual(userScopes);
    });
  });

  describe('filterAccessibleScopes', () => {
    it('returns all requested scopes for ADMIN', () => {
      const userScopes: string[] = [];
      const requested = [packagingScopeId, productionScopeId, qualityScopeId];
      const result = filterAccessibleScopes(adminUser, userScopes, requested);
      expect(result).toEqual(requested);
    });

    it('filters to only accessible scopes for USER', () => {
      const userScopes = [packagingScopeId];
      const requested = [packagingScopeId, productionScopeId];
      const result = filterAccessibleScopes(normalUser, userScopes, requested);
      expect(result).toEqual([packagingScopeId]);
    });
  });

  describe('buildScopeFilter', () => {
    it('returns empty filter for ADMIN', () => {
      const filter = buildScopeFilter(adminUser, []);
      expect(filter).toEqual({});
    });

    it('returns IN filter for users with scopes', () => {
      const userScopes = [packagingScopeId, productionScopeId];
      const filter = buildScopeFilter(normalUser, userScopes);
      expect(filter).toEqual({
        scopeId: {
          in: userScopes,
        },
      });
    });

    it('returns no-access filter for users with no scopes', () => {
      const filter = buildScopeFilter(normalUser, []);
      expect(filter).toEqual({
        scopeId: 'no-access',
      });
    });
  });

  describe('validateScopeForCreate', () => {
    it('allows ADMIN to create in any scope', () => {
      expect(() =>
        validateScopeForCreate(adminUser, [], productionScopeId)
      ).not.toThrow();
    });

    it('allows user to create in their scope', () => {
      const userScopes = [packagingScopeId];
      expect(() =>
        validateScopeForCreate(normalUser, userScopes, packagingScopeId)
      ).not.toThrow();
    });

    it('denies user from creating in scope they do not have', () => {
      const userScopes = [packagingScopeId];
      expect(() =>
        validateScopeForCreate(normalUser, userScopes, productionScopeId)
      ).toThrow();
    });
  });

  describe('ScopedAuthorizationRule', () => {
    it('allows admin to bypass scope checks', () => {
      const rule = new ScopedAuthorizationRule().allowAdmin();
      const ctx = createScopedAuthContext(adminUser, 'read', [], {
        scopeId: productionScopeId,
      });

      expect(() => rule.authorize(ctx)).not.toThrow();
    });

    it('allows user with scope access', () => {
      const rule = new ScopedAuthorizationRule().allowScopeAccess();
      const ctx = createScopedAuthContext(
        normalUser,
        'read',
        [packagingScopeId],
        { scopeId: packagingScopeId }
      );

      expect(() => rule.authorize(ctx)).not.toThrow();
    });

    it('denies user without scope access', () => {
      const rule = new ScopedAuthorizationRule().allowScopeAccess();
      const ctx = createScopedAuthContext(
        normalUser,
        'read',
        [packagingScopeId],
        { scopeId: productionScopeId }
      );

      expect(() => rule.authorize(ctx)).toThrow();
    });

    it('allows creator with scope access', () => {
      const rule = new ScopedAuthorizationRule().allowCreator();
      const ctx = createScopedAuthContext(
        normalUser,
        'update',
        [packagingScopeId],
        {
          scopeId: packagingScopeId,
          createdById: normalUser.userId,
        }
      );

      expect(() => rule.authorize(ctx)).not.toThrow();
    });

    it('denies creator without scope access', () => {
      const rule = new ScopedAuthorizationRule().allowCreator();
      const ctx = createScopedAuthContext(
        normalUser,
        'update',
        [packagingScopeId],
        {
          scopeId: productionScopeId,
          createdById: normalUser.userId,
        }
      );

      expect(() => rule.authorize(ctx)).toThrow();
    });

    it('allows assignee with scope access', () => {
      const rule = new ScopedAuthorizationRule().allowAssignee();
      const ctx = createScopedAuthContext(
        normalUser,
        'update',
        [packagingScopeId],
        {
          scopeId: packagingScopeId,
          assignedToId: normalUser.userId,
        }
      );

      expect(() => rule.authorize(ctx)).not.toThrow();
    });

    it('combines multiple rules with OR logic', () => {
      const rule = new ScopedAuthorizationRule()
        .allowAdmin()
        .allowCreator();

      // Test ADMIN path
      const adminCtx = createScopedAuthContext(adminUser, 'update', [], {
        scopeId: productionScopeId,
        createdById: 'other-user',
      });
      expect(() => rule.authorize(adminCtx)).not.toThrow();

      // Test creator path
      const creatorCtx = createScopedAuthContext(
        normalUser,
        'update',
        [packagingScopeId],
        {
          scopeId: packagingScopeId,
          createdById: normalUser.userId,
        }
      );
      expect(() => rule.authorize(creatorCtx)).not.toThrow();

      // Test neither path
      const neitherCtx = createScopedAuthContext(
        normalUser,
        'update',
        [packagingScopeId],
        {
          scopeId: productionScopeId,
          createdById: 'other-user',
        }
      );
      expect(() => rule.authorize(neitherCtx)).toThrow();
    });
  });

  describe('ScopedAuthorizationPolicies', () => {
    describe('NonConformance', () => {
      it('allows user to create in their scope', () => {
        const policy = ScopedAuthorizationPolicies.nonConformance.create();
        const ctx = createScopedAuthContext(
          normalUser,
          'create',
          [packagingScopeId],
          { scopeId: packagingScopeId }
        );

        expect(() => policy.authorize(ctx)).not.toThrow();
      });

      it('allows user to read resources in their scope', () => {
        const policy = ScopedAuthorizationPolicies.nonConformance.read();
        const ctx = createScopedAuthContext(
          normalUser,
          'read',
          [packagingScopeId],
          { scopeId: packagingScopeId }
        );

        expect(() => policy.authorize(ctx)).not.toThrow();
      });

      it('denies user from reading resources outside their scope', () => {
        const policy = ScopedAuthorizationPolicies.nonConformance.read();
        const ctx = createScopedAuthContext(
          normalUser,
          'read',
          [packagingScopeId],
          { scopeId: productionScopeId }
        );

        expect(() => policy.authorize(ctx)).toThrow();
      });

      it('allows creator to update their NC in their scope', () => {
        const policy = ScopedAuthorizationPolicies.nonConformance.update();
        const ctx = createScopedAuthContext(
          normalUser,
          'update',
          [packagingScopeId],
          {
            scopeId: packagingScopeId,
            reportedById: normalUser.userId,
          }
        );

        expect(() => policy.authorize(ctx)).not.toThrow();
      });

      it('denies creator from updating their NC outside their scope', () => {
        const policy = ScopedAuthorizationPolicies.nonConformance.update();
        const ctx = createScopedAuthContext(
          normalUser,
          'update',
          [packagingScopeId],
          {
            scopeId: productionScopeId,
            reportedById: normalUser.userId,
          }
        );

        expect(() => policy.authorize(ctx)).toThrow();
      });

      it('allows manager to update any NC in their scope', () => {
        const policy = ScopedAuthorizationPolicies.nonConformance.update();
        const ctx = createScopedAuthContext(
          managerUser,
          'update',
          [packagingScopeId],
          {
            scopeId: packagingScopeId,
            reportedById: 'other-user',
          }
        );

        expect(() => policy.authorize(ctx)).not.toThrow();
      });
    });

    describe('CorrectiveAction', () => {
      it('allows assignee to update action in their scope', () => {
        const policy = ScopedAuthorizationPolicies.correctiveAction.update();
        const ctx = createScopedAuthContext(
          normalUser,
          'update',
          [packagingScopeId],
          {
            scopeId: packagingScopeId,
            assignedToId: normalUser.userId,
          }
        );

        expect(() => policy.authorize(ctx)).not.toThrow();
      });

      it('denies assignee from updating action outside their scope', () => {
        const policy = ScopedAuthorizationPolicies.correctiveAction.update();
        const ctx = createScopedAuthContext(
          normalUser,
          'update',
          [packagingScopeId],
          {
            scopeId: productionScopeId,
            assignedToId: normalUser.userId,
          }
        );

        expect(() => policy.authorize(ctx)).toThrow();
      });
    });

    describe('Document', () => {
      it('allows creator to update document in their scope', () => {
        const policy = ScopedAuthorizationPolicies.document.update();
        const ctx = createScopedAuthContext(
          normalUser,
          'update',
          [packagingScopeId],
          {
            scopeId: packagingScopeId,
            createdById: normalUser.userId,
          }
        );

        expect(() => policy.authorize(ctx)).not.toThrow();
      });
    });

    describe('Scope Management', () => {
      it('allows only ADMIN to create scope', () => {
        const policy = ScopedAuthorizationPolicies.scope.create();
        
        const adminCtx = createScopedAuthContext(adminUser, 'create', []);
        expect(() => policy.authorize(adminCtx)).not.toThrow();

        const userCtx = createScopedAuthContext(normalUser, 'create', []);
        expect(() => policy.authorize(userCtx)).toThrow();
      });

      it('allows ADMIN and MANAGER to read scopes', () => {
        const policy = ScopedAuthorizationPolicies.scope.read();

        const adminCtx = createScopedAuthContext(adminUser, 'read', []);
        expect(() => policy.authorize(adminCtx)).not.toThrow();

        const managerCtx = createScopedAuthContext(managerUser, 'read', []);
        expect(() => policy.authorize(managerCtx)).not.toThrow();

        const userCtx = createScopedAuthContext(normalUser, 'read', []);
        expect(() => policy.authorize(userCtx)).toThrow();
      });
    });
  });

  describe('Multi-Scope User Scenarios', () => {
    it('user with multiple scopes can access resources in any of their scopes', () => {
      const userScopes = [packagingScopeId, productionScopeId];
      const policy = ScopedAuthorizationPolicies.nonConformance.read();

      // Can access packaging
      const packagingCtx = createScopedAuthContext(
        normalUser,
        'read',
        userScopes,
        { scopeId: packagingScopeId }
      );
      expect(() => policy.authorize(packagingCtx)).not.toThrow();

      // Can access production
      const productionCtx = createScopedAuthContext(
        normalUser,
        'read',
        userScopes,
        { scopeId: productionScopeId }
      );
      expect(() => policy.authorize(productionCtx)).not.toThrow();

      // Cannot access quality
      const qualityCtx = createScopedAuthContext(normalUser, 'read', userScopes, {
        scopeId: qualityScopeId,
      });
      expect(() => policy.authorize(qualityCtx)).toThrow();
    });

    it('buildScopeFilter returns IN clause for multi-scope users', () => {
      const userScopes = [packagingScopeId, productionScopeId, qualityScopeId];
      const filter = buildScopeFilter(normalUser, userScopes);

      expect(filter).toEqual({
        scopeId: {
          in: userScopes,
        },
      });
    });
  });

  describe('ADMIN Bypass Scenarios', () => {
    it('ADMIN can access resources in any scope', () => {
      const policy = ScopedAuthorizationPolicies.nonConformance.read();
      const ctx = createScopedAuthContext(adminUser, 'read', [], {
        scopeId: productionScopeId,
      });

      expect(() => policy.authorize(ctx)).not.toThrow();
    });

    it('ADMIN can create resources in any scope', () => {
      const policy = ScopedAuthorizationPolicies.nonConformance.create();
      const ctx = createScopedAuthContext(adminUser, 'create', [], {
        scopeId: productionScopeId,
      });

      expect(() => policy.authorize(ctx)).not.toThrow();
    });

    it('buildScopeFilter returns empty object for ADMIN', () => {
      const filter = buildScopeFilter(adminUser, []);
      expect(filter).toEqual({});
    });
  });
});

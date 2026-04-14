# Scope-Based Access Control - Implementation Checklist

## Phase 1: Database Schema (Day 1)

### 1.1 Update Prisma Schema
- [ ] Copy `prisma/schema-with-scopes.prisma` to `prisma/schema.prisma`
- [ ] Review the schema changes
- [ ] Create migration: `npx prisma migrate dev --name add_scope_based_access`
- [ ] Generate Prisma client: `npx prisma generate`

### 1.2 Seed Default Scopes
- [ ] Create default scopes (packaging, production, quality, warehouse)
- [ ] Run seed script: `npx prisma db seed`

### 1.3 Migrate Existing Data
```typescript
// Migration script to assign existing resources to default scope
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToScopes() {
  // Get or create default scope
  let defaultScope = await prisma.scope.findFirst({
    where: { name: 'general' },
  });

  if (!defaultScope) {
    defaultScope = await prisma.scope.create({
      data: {
        name: 'general',
        description: 'General/Default Scope',
      },
    });
  }

  console.log('Default scope:', defaultScope.id);

  // Assign all existing NonConformances to default scope
  const ncUpdate = await prisma.nonConformance.updateMany({
    data: { scopeId: defaultScope.id },
  });
  console.log(`Updated ${ncUpdate.count} NonConformances`);

  // Assign all existing Documents to default scope
  const docUpdate = await prisma.document.updateMany({
    data: { scopeId: defaultScope.id },
  });
  console.log(`Updated ${docUpdate.count} Documents`);

  // Assign all existing CorrectiveActions to default scope
  const caUpdate = await prisma.correctiveAction.updateMany({
    data: { scopeId: defaultScope.id },
  });
  console.log(`Updated ${caUpdate.count} CorrectiveActions`);

  // Assign all existing users to default scope
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    try {
      await prisma.userScope.create({
        data: {
          userId: user.id,
          scopeId: defaultScope.id,
        },
      });
      console.log(`Assigned user ${user.email} to default scope`);
    } catch (error) {
      console.log(`User ${user.email} already assigned`);
    }
  }

  console.log('Migration complete!');
}

migrateToScopes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Phase 2: Authorization Layer (Day 2)

### 2.1 Add Scoped Authorization Utilities
- [ ] Add `src/shared/utils/scopedAuthorization.ts` (already provided)
- [ ] Export from `src/shared/utils/index.ts`:
```typescript
export * from './scopedAuthorization';
```

### 2.2 Create Scope Service
- [ ] Add `src/modules/scope/scope.service.ts` (already provided)
- [ ] Add validation schemas for scope operations
- [ ] Add unit tests for scope service

### 2.3 Update JWT Payload
```typescript
// src/shared/utils/jwt.ts
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  scopeIds?: string[]; // NEW: Cache user's scope IDs
}
```

### 2.4 Update Auth Service
```typescript
// src/modules/auth/auth.service.ts
async login(credentials) {
  // ... existing login logic ...
  
  // Get user's scope IDs
  const scopeService = new ScopeService();
  const scopeIds = await scopeService.getUserScopeIds(user.id);
  
  // Include in JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    scopeIds, // Include scope IDs in token
  });
  
  return { token, user };
}
```

## Phase 3: Service Layer Updates (Day 3-4)

### 3.1 Update NonConformance Service
- [ ] Add `scopeId` to `CreateNonConformanceInput`
- [ ] Update `createNonConformance` to validate scope access
- [ ] Update `getNonConformances` to filter by user scopes
- [ ] Update `getNonConformanceById` to check scope access
- [ ] Update `updateNonConformance` to check scope access
- [ ] Update all authorization calls to use `ScopedAuthorizationPolicies`

Example changes:
```typescript
// Before
async createNonConformance(input: CreateInput, user?: JWTPayload) {
  const validUser = requireAuthentication(user);
  AuthorizationPolicies.nonConformance.create().authorize(
    createAuthContext(validUser, 'create')
  );
  // ...
}

// After
async createNonConformance(input: CreateInput, user?: JWTPayload) {
  const validUser = requireAuthentication(user);
  
  // Get user's scope IDs (from JWT or database)
  const userScopeIds = user.scopeIds || await scopeService.getUserScopeIds(user.userId);
  
  // Validate scope access
  validateScopeForCreate(validUser, userScopeIds, input.scopeId);
  
  // Scoped authorization
  ScopedAuthorizationPolicies.nonConformance.create().authorize(
    createScopedAuthContext(validUser, 'create', userScopeIds, { scopeId: input.scopeId })
  );
  
  // Create with scopeId
  return prisma.nonConformance.create({
    data: {
      ...input,
      reportedById: validUser.userId,
      scopeId: input.scopeId, // NEW
    },
  });
}
```

### 3.2 Update Document Service
- [ ] Add `scopeId` to `CreateDocumentInput`
- [ ] Update create operation with scope validation
- [ ] Update queries to filter by user scopes
- [ ] Update authorization checks

### 3.3 Update CorrectiveAction Service
- [ ] Add `scopeId` to `CreateCorrectiveActionInput`
- [ ] Inherit scopeId from NonConformance by default
- [ ] Update create operation with scope validation
- [ ] Update queries to filter by user scopes

### 3.4 Update User Service
- [ ] Add method to get user's scopes
- [ ] Add method to manage user scope assignments (ADMIN only)

## Phase 4: API Layer (Day 5)

### 4.1 Add Scope Routes
```typescript
// src/modules/scope/scope.routes.ts
router.post('/scopes', scopeController.createScope);
router.get('/scopes', scopeController.getScopes);
router.get('/scopes/:id', scopeController.getScopeById);
router.put('/scopes/:id', scopeController.updateScope);
router.delete('/scopes/:id', scopeController.deleteScope);
router.post('/scopes/assign', scopeController.assignUserToScope);
router.delete('/scopes/:scopeId/users/:userId', scopeController.removeUserFromScope);
```

### 4.2 Update Existing Routes
- [ ] Add `scopeId` query parameter to list endpoints
- [ ] Update create endpoints to require `scopeId`
- [ ] Update validation schemas

### 4.3 GraphQL Schema Updates (if applicable)
```graphql
type Scope {
  id: ID!
  name: String!
  description: String
  isActive: Boolean!
  userCount: Int!
  resourceCount: Int!
}

type NonConformance {
  # ... existing fields ...
  scope: Scope!
  scopeId: ID!
}

input CreateNonConformanceInput {
  # ... existing fields ...
  scopeId: ID! # NEW: Required
}

type Query {
  scopes: [Scope!]!
  scope(id: ID!): Scope
  userScopes(userId: ID!): [Scope!]!
}

type Mutation {
  createScope(input: CreateScopeInput!): Scope!
  assignUserToScope(userId: ID!, scopeId: ID!): UserScope!
  removeUserFromScope(userId: ID!, scopeId: ID!): Boolean!
}
```

## Phase 5: Testing (Day 6)

### 5.1 Unit Tests
- [ ] Test scope service CRUD operations
- [ ] Test user scope assignment/removal
- [ ] Test scoped authorization rules
- [ ] Test scope filtering functions

### 5.2 Integration Tests
- [ ] Test creating resources in different scopes
- [ ] Test multi-scope user access
- [ ] Test ADMIN bypass
- [ ] Test scope isolation (user can't access other scopes)

### 5.3 End-to-End Tests
- [ ] Test complete workflow with scopes
- [ ] Test scope assignment changes
- [ ] Test error scenarios

Example test:
```typescript
describe('Scope-Based Access Control', () => {
  it('user can only access resources in their scopes', async () => {
    // Create two scopes
    const packagingScope = await scopeService.createScope(
      { name: 'packaging' },
      admin
    );
    const productionScope = await scopeService.createScope(
      { name: 'production' },
      admin
    );

    // Create user assigned to packaging only
    const user = await createUser({ role: 'USER' });
    await scopeService.assignUserToScope(
      { userId: user.id, scopeId: packagingScope.id },
      admin
    );

    // Create NC in packaging (user has access)
    const packagingNC = await ncService.createNC(
      { title: 'Test', description: 'Test', scopeId: packagingScope.id },
      user
    );
    expect(packagingNC).toBeDefined();

    // Try to create NC in production (user has no access)
    await expect(
      ncService.createNC(
        { title: 'Test', description: 'Test', scopeId: productionScope.id },
        user
      )
    ).rejects.toThrow('Cannot create resource in this scope');

    // User can see packaging NC
    const ncs = await ncService.getNCs({}, {}, user);
    expect(ncs.items).toHaveLength(1);
    expect(ncs.items[0].scopeId).toBe(packagingScope.id);
  });

  it('ADMIN can access all scopes', async () => {
    const admin = { userId: 'admin1', role: 'ADMIN', scopeIds: [] };
    
    // Create NCs in different scopes
    const nc1 = await ncService.createNC({ scopeId: 'scope1', ... }, admin);
    const nc2 = await ncService.createNC({ scopeId: 'scope2', ... }, admin);
    
    // Admin can see all
    const ncs = await ncService.getNCs({}, {}, admin);
    expect(ncs.items).toHaveLength(2);
  });

  it('multi-scope user can access all assigned scopes', async () => {
    const user = {
      userId: 'user1',
      role: 'USER',
      scopeIds: ['scope1', 'scope2'],
    };

    // Create NCs in both scopes
    const nc1 = await ncService.createNC({ scopeId: 'scope1', ... }, user);
    const nc2 = await ncService.createNC({ scopeId: 'scope2', ... }, user);

    // User can see both
    const ncs = await ncService.getNCs({}, {}, user);
    expect(ncs.items).toHaveLength(2);
  });
});
```

## Phase 6: Documentation & Deployment (Day 7)

### 6.1 Update API Documentation
- [ ] Document new scope endpoints
- [ ] Document scopeId requirement in create endpoints
- [ ] Document scope filtering in list endpoints
- [ ] Add examples for multi-scope users

### 6.2 Update User Documentation
- [ ] Explain scope concept to end users
- [ ] Document how to view user's scopes
- [ ] Document ADMIN scope management

### 6.3 Deployment Checklist
- [ ] Run migration on staging environment
- [ ] Test scope functionality on staging
- [ ] Create backup before production migration
- [ ] Run migration on production
- [ ] Verify all users have at least one scope
- [ ] Verify all resources have scopeId
- [ ] Monitor error logs for scope-related issues

## Performance Optimization (Ongoing)

### Cache User Scope IDs
```typescript
// src/middlewares/auth.ts
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    const payload = verifyToken(token);
    
    // If scopeIds not in JWT, fetch and cache
    if (!payload.scopeIds) {
      payload.scopeIds = await scopeService.getUserScopeIds(payload.userId);
    }
    
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
```

### Add Redis Caching
```typescript
// src/modules/scope/scope.cache.ts
import Redis from 'ioredis';

const redis = new Redis();
const CACHE_TTL = 3600; // 1 hour

export async function getCachedUserScopes(userId: string): Promise<string[]> {
  const cacheKey = `user:${userId}:scopes`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const scopeIds = await scopeService.getUserScopeIds(userId);
  
  // Cache for 1 hour
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(scopeIds));
  
  return scopeIds;
}

export async function invalidateUserScopeCache(userId: string): Promise<void> {
  await redis.del(`user:${userId}:scopes`);
}
```

## Rollback Plan

If issues occur:

### 1. Rollback Database
```bash
# Rollback last migration
npx prisma migrate rollback
```

### 2. Revert Code Changes
```bash
git revert <commit-hash>
```

### 3. Clear Cached Scope IDs
```typescript
// If using Redis
redis.flushdb();
```

## Success Criteria

- [ ] All users have at least one scope assigned
- [ ] All resources have scopeId populated
- [ ] Users can only see resources in their scopes
- [ ] ADMIN can see all resources regardless of scope
- [ ] Multi-scope users can see resources from all assigned scopes
- [ ] Creating resource requires valid scopeId
- [ ] Creating resource validates user has access to scope
- [ ] No performance degradation (queries < 100ms)
- [ ] All tests passing
- [ ] Zero scope-related errors in production

## Estimated Timeline

- **Day 1**: Database schema & migration (4-6 hours)
- **Day 2**: Authorization layer (4-6 hours)
- **Day 3-4**: Service layer updates (8-12 hours)
- **Day 5**: API layer updates (4-6 hours)
- **Day 6**: Testing (6-8 hours)
- **Day 7**: Documentation & deployment (4-6 hours)

**Total**: ~30-44 hours (1-2 weeks)

## Post-Implementation

### Monitoring
- [ ] Monitor database query performance
- [ ] Monitor scope-related errors
- [ ] Monitor cache hit rates (if using Redis)
- [ ] Track scope assignment changes

### Maintenance
- [ ] Regular scope cleanup (inactive scopes)
- [ ] Audit user scope assignments
- [ ] Review scope-based access logs
- [ ] Optimize queries as needed

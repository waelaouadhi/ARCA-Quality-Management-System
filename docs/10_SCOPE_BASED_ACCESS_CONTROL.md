# Scope-Based Access Control Implementation Guide

## Overview

This document describes the implementation of **scope-based access control** (department-level isolation) in the QMS system. Users can belong to one or multiple scopes (e.g., "packaging", "production"), and resources are isolated by scope.

## Key Features

✅ **Multi-scope Users**: Users can belong to multiple departments/scopes  
✅ **Scope Isolation**: Resources are only accessible to users in matching scopes  
✅ **ADMIN Bypass**: ADMIN users can access all scopes  
✅ **Flexible Assignment**: Users can be assigned/removed from scopes dynamically  
✅ **Performance Optimized**: Indexed queries and efficient filtering

## Database Schema Changes

###  New Models

#### 1. Scope Model
```prisma
model Scope {
  id          String   @id @default(cuid())
  name        String   @unique  // e.g., "packaging", "production"
  description String?
  isActive    Boolean  @default(true)

  users               UserScope[]
  nonConformances     NonConformance[]
  documents           Document[]
  correctiveActions   CorrectiveAction[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
  @@index([isActive])
}
```

#### 2. UserScope Junction Table
```prisma
model UserScope {
  userId    String
  scopeId   String

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scope     Scope    @relation(fields: [scopeId], references: [id], onDelete: Cascade)

  assignedAt DateTime @default(now())

  @@id([userId, scopeId])
  @@index([userId])
  @@index([scopeId])
}
```

### Modified Models

#### User Model
```prisma
model User {
  // ... existing fields ...
  
  // NEW: Many-to-many with Scope
  scopes  UserScope[]
}
```

#### NonConformance Model
```prisma
model NonConformance {
  // ... existing fields ...
  
  // NEW: Scope relationship
  scopeId  String
  scope    Scope  @relation(fields: [scopeId], references: [id])

  @@index([scopeId])
  @@index([scopeId, status]) // Composite index
}
```

#### Document Model
```prisma
model Document {
  // ... existing fields ...
  
  // NEW: Scope relationship
  scopeId  String
  scope    Scope  @relation(fields: [scopeId], references: [id])

  @@index([scopeId])
  @@index([scopeId, status]) // Composite index
}
```

#### CorrectiveAction Model
```prisma
model CorrectiveAction {
  // ... existing fields ...
  
  // NEW: Scope relationship (inherited from NonConformance)
  scopeId  String
  scope    Scope  @relation(fields: [scopeId], references: [id])

  @@index([scopeId])
  @@index([scopeId, status]) // Composite index
}
```

## Migration Strategy

### Step 1: Add Scope Models
```bash
# Create migration file
npx prisma migrate dev --name add_scopes
```

### Step 2: Seed Default Scopes
```typescript
// prisma/seed.ts
const defaultScopes = [
  { name: 'packaging', description: 'Packaging Department' },
  { name: 'production', description: 'Production Department' },
  { name: 'quality', description: 'Quality Assurance' },
  { name: 'warehouse', description: 'Warehouse Operations' },
];

for (const scope of defaultScopes) {
  await prisma.scope.create({ data: scope });
}
```

### Step 3: Assign Existing Resources
```typescript
// Assign all existing resources to a default scope
const defaultScope = await prisma.scope.findFirst();

// Update NonConformances
await prisma.nonConformance.updateMany({
  data: { scopeId: defaultScope.id },
});

// Update Documents
await prisma.document.updateMany({
  data: { scopeId: defaultScope.id },
});

// Update CorrectiveActions
await prisma.correctiveAction.updateMany({
  data: { scopeId: defaultScope.id },
});
```

### Step 4: Assign Users to Scopes
```typescript
// Assign all existing users to default scope
const users = await prisma.user.findMany();
const defaultScope = await prisma.scope.findFirst();

for (const user of users) {
  await prisma.userScope.create({
    data: {
      userId: user.id,
      scopeId: defaultScope.id,
    },
  });
}
```

## Authorization Logic

### Core Functions

#### 1. Get User's Scope IDs
```typescript
const scopeService = new ScopeService();
const userScopeIds = await scopeService.getUserScopeIds(userId);
// Returns: ['scope-id-1', 'scope-id-2']
```

#### 2. Build Scope Filter
```typescript
import { buildScopeFilter } from '@/shared/utils/scopedAuthorization';

const scopeFilter = buildScopeFilter(user, userScopeIds);
// ADMIN: returns {}
// USER: returns { scopeId: { in: ['scope-1', 'scope-2'] } }
```

#### 3. Validate Scope Access
```typescript
import { validateScopeForCreate } from '@/shared/utils/scopedAuthorization';

validateScopeForCreate(user, userScopeIds, targetScopeId);
// Throws AuthorizationError if user can't create in scope
```

#### 4. Scoped Authorization
```typescript
import {
  ScopedAuthorizationPolicies,
  createScopedAuthContext,
} from '@/shared/utils/scopedAuthorization';

// Check authorization with scope
ScopedAuthorizationPolicies.nonConformance.update().authorize(
  createScopedAuthContext(user, 'update', userScopeIds, {
    reportedById: resource.reportedById,
    scopeId: resource.scopeId,
  })
);
```

## Example Queries

### 1. Get Resources in User's Scopes
```typescript
const userScopeIds = await scopeService.getUserScopeIds(user.userId);
const scopeFilter = buildScopeFilter(user, userScopeIds);

const nonConformances = await prisma.nonConformance.findMany({
  where: {
    ...scopeFilter,
    status: 'OPEN',
  },
  include: {
    scope: true,
    reportedBy: true,
  },
});
```

### 2. Create Resource in Scope
```typescript
// Validate user can create in this scope
validateScopeForCreate(user, userScopeIds, input.scopeId);

const nc = await prisma.nonConformance.create({
  data: {
    title: input.title,
    description: input.description,
    reportedById: user.userId,
    scopeId: input.scopeId, // ✅ Scope assigned
  },
});
```

### 3. Filter by Specific Scope
```typescript
// User requests specific scope - validate access first
if (!user.role === 'ADMIN' && !userScopeIds.includes(requestedScopeId)) {
  throw new AuthorizationError('No access to this scope');
}

const docs = await prisma.document.findMany({
  where: { scopeId: requestedScopeId },
});
```

### 4. Multi-Scope User Query
```typescript
// User with multiple scopes sees resources from ALL their scopes
const userScopeIds = await scopeService.getUserScopeIds(user.userId);
// Returns: ['packaging-id', 'production-id']

const resources = await prisma.nonConformance.findMany({
  where: {
    scopeId: {
      in: userScopeIds, // ✅ Matches ANY of user's scopes
    },
  },
});
```

### 5. Scope Statistics
```typescript
const stats = await prisma.nonConformance.groupBy({
  by: ['scopeId', 'status'],
  where: {
    scopeId: {
      in: userScopeIds,
    },
  },
  _count: true,
});
```

## Performance Considerations

### 1. Database Indexes

**Added Indexes:**
```prisma
// Single-column indexes
@@index([scopeId])

// Composite indexes for common queries
@@index([scopeId, status])
@@index([scopeId, severity])

// UserScope junction table
@@index([userId])
@@index([scopeId])
```

**Query Performance:**
- ✅ `WHERE scopeId = X` - Uses single-column index
- ✅ `WHERE scopeId IN (...)` - Uses single-column index
- ✅ `WHERE scopeId = X AND status = Y` - Uses composite index
- ✅ Joining UserScope - Uses junction table indexes

### 2. Caching Strategies

#### Cache User Scope IDs in JWT
```typescript
// When generating JWT
const userScopeIds = await scopeService.getUserScopeIds(user.id);

const token = generateToken({
  userId: user.id,
  email: user.email,
  role: user.role,
  scopeIds: userScopeIds, // ✅ Cache in token
});
```

#### Cache Scope List
```typescript
// Scopes rarely change - cache in Redis/memory
import { Redis } from 'ioredis';
const redis = new Redis();

const SCOPE_CACHE_KEY = 'scopes:all';
const CACHE_TTL = 3600; // 1 hour

async function getScopes() {
  const cached = await redis.get(SCOPE_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const scopes = await prisma.scope.findMany();
  await redis.setex(SCOPE_CACHE_KEY, CACHE_TTL, JSON.stringify(scopes));
  
  return scopes;
}
```

### 3. Query Optimization

#### Use Select Instead of Include
```typescript
// ❌ Bad - fetches all scope data
const nc = await prisma.nonConformance.findMany({
  include: { scope: true },
});

// ✅ Good - only fetch needed fields
const nc = await prisma.nonConformance.findMany({
  select: {
    id: true,
    title: true,
    scopeId: true,
    scope: {
      select: { name: true },
    },
  },
});
```

#### Batch Scope ID Lookups
```typescript
// ❌ Bad - N+1 query problem
for (const userId of userIds) {
  const scopeIds = await scopeService.getUserScopeIds(userId);
}

// ✅ Good - single query
const userScopes = await prisma.userScope.findMany({
  where: {
    userId: { in: userIds },
  },
  select: { userId: true, scopeId: true },
});

const scopeMap = new Map();
userScopes.forEach(us => {
  if (!scopeMap.has(us.userId)) scopeMap.set(us.userId, []);
  scopeMap.get(us.userId).push(us.scopeId);
});
```

### 4. Materialized Views (Advanced)

For complex reporting, consider materialized views:
```sql
CREATE MATERIALIZED VIEW scope_nc_stats AS
SELECT
  scopeId,
  status,
  COUNT(*) as count
FROM "NonConformance"
GROUP BY scopeId, status;

-- Refresh periodically
REFRESH MATERIALIZED VIEW scope_nc_stats;
```

## API Examples

### 1. Create Scope
```typescript
POST /api/scopes

{
  "name": "packaging",
  "description": "Packaging Department"
}

// Response
{
  "id": "scope-123",
  "name": "packaging",
  "description": "Packaging Department",
  "isActive": true
}
```

### 2. Assign User to Scope
```typescript
POST /api/scopes/assign

{
  "userId": "user-123",
  "scopeId": "scope-456"
}

// Response
{
  "userId": "user-123",
  "scopeId": "scope-456",
  "assignedAt": "2026-04-07T09:00:00Z"
}
```

### 3. Create NonConformance in Scope
```typescript
POST /api/non-conformances

{
  "title": "Defective Label",
  "description": "Label printing quality issue",
  "severity": "HIGH",
  "scopeId": "packaging-scope-id" // ✅ Required
}

// Response (only if user has access to packaging scope)
{
  "id": "nc-123",
  "title": "Defective Label",
  "scopeId": "packaging-scope-id",
  "scope": {
    "id": "packaging-scope-id",
    "name": "packaging"
  }
}
```

### 4. List Resources (Filtered by Scope)
```typescript
GET /api/non-conformances?scopeId=packaging-scope-id

// Returns only NCs in packaging scope (if user has access)
{
  "items": [...],
  "total": 10,
  "page": 1,
  "pageSize": 10
}
```

### 5. Get User's Scopes
```typescript
GET /api/users/{userId}/scopes

// Response
[
  {
    "scopeId": "scope-1",
    "scope": {
      "id": "scope-1",
      "name": "packaging",
      "description": "Packaging Department"
    },
    "assignedAt": "2026-01-01T00:00:00Z"
  },
  {
    "scopeId": "scope-2",
    "scope": {
      "id": "scope-2",
      "name": "production",
      "description": "Production Department"
    },
    "assignedAt": "2026-01-15T00:00:00Z"
  }
]
```

## Testing Scenarios

### Scenario 1: User with Single Scope
```typescript
// User assigned to "packaging" only
const user = { userId: 'user1', role: 'USER', scopeIds: ['packaging-id'] };

// ✅ Can create NC in packaging scope
await service.createNC({ scopeId: 'packaging-id', ... }, user);

// ❌ Cannot create NC in production scope
await service.createNC({ scopeId: 'production-id', ... }, user);
// Throws: AuthorizationError
```

### Scenario 2: User with Multiple Scopes
```typescript
// User assigned to both "packaging" and "production"
const user = { 
  userId: 'user2', 
  role: 'USER', 
  scopeIds: ['packaging-id', 'production-id']
};

// ✅ Can see NCs from BOTH scopes
const ncs = await service.getNCs({}, {}, user);
// Returns NCs from packaging AND production
```

### Scenario 3: ADMIN Bypasses Scope
```typescript
// ADMIN can access ALL scopes
const admin = { userId: 'admin1', role: 'ADMIN', scopeIds: [] };

// ✅ Can create in ANY scope
await service.createNC({ scopeId: 'any-scope-id', ... }, admin);

// ✅ Can see ALL NCs
const ncs = await service.getNCs({}, {}, admin);
// Returns NCs from ALL scopes
```

### Scenario 4: Cross-Scope Collaboration
```typescript
// Manager from production reviews packaging NC
const manager = { 
  userId: 'mgr1', 
  role: 'MANAGER', 
  scopeIds: ['production-id'] 
};

// ❌ Cannot access packaging NC
await service.getNCById('packaging-nc-id', manager);
// Throws: AuthorizationError

// Solution: Assign manager to packaging scope
await scopeService.assignUserToScope({
  userId: 'mgr1',
  scopeId: 'packaging-id'
}, admin);

// ✅ Now can access
await service.getNCById('packaging-nc-id', manager);
```

## Best Practices

### 1. Always Fetch User Scopes Early
```typescript
// ✅ Good - fetch once, use many times
const userScopeIds = await scopeService.getUserScopeIds(user.userId);
const scopeFilter = buildScopeFilter(user, userScopeIds);

// Use in multiple queries
const ncs = await prisma.nonConformance.findMany({ where: scopeFilter });
const docs = await prisma.document.findMany({ where: scopeFilter });
```

### 2. Cache Scope IDs in JWT
```typescript
// Include scopeIds in JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  scopeIds: string[]; // ✅ Cached for performance
}
```

### 3. Validate Before Create
```typescript
// Always validate scope access before creation
validateScopeForCreate(user, userScopeIds, input.scopeId);
```

### 4. Use Composite Indexes
```typescript
// Query patterns that benefit from composite indexes
await prisma.nonConformance.findMany({
  where: {
    scopeId: 'scope-1',
    status: 'OPEN', // ✅ Uses (scopeId, status) composite index
  },
});
```

### 5. Handle Scope Changes
```typescript
// When user is removed from scope, they lose access immediately
// No need to invalidate resources - scope filter handles it
await scopeService.removeUserFromScope(userId, scopeId, admin);
```

## Summary

**Key Changes:**
- ✅ Added `Scope` model and `UserScope` junction table
- ✅ Added `scopeId` to all resources (NonConformance, Document, CorrectiveAction)
- ✅ Extended authorization system with scope checks
- ✅ ADMIN bypasses all scope restrictions
- ✅ Multi-scope users supported via many-to-many relationship

**Performance:**
- ✅ Database indexes on scopeId and composite (scopeId, status)
- ✅ Efficient IN queries for multi-scope users
- ✅ Caching strategies for scope IDs

**Files Created:**
- `prisma/schema-with-scopes.prisma` - Updated database schema
- `src/shared/utils/scopedAuthorization.ts` - Scoped authorization logic
- `src/modules/scope/scope.service.ts` - Scope management service
- `src/modules/scope/scopedNonConformance.example.ts` - Example implementation

# Resource-Based Authorization System

## Overview

This document describes the refactored authorization system that supports resource-based access control (RBAC). The new system allows users to update resources they created or are assigned to, while maintaining role-based hierarchy.

## Architecture

### Key Components

1. **Authorization Utilities** (`src/shared/utils/authorization.ts`)
   - Core authorization functions and rule builder
   - Pre-defined authorization policies for each resource type

2. **Authorization Context**
   - Encapsulates user, action, and resource ownership information
   - Used to evaluate authorization rules

3. **Authorization Rule Builder**
   - Fluent API for building complex authorization rules
   - Supports OR logic (any rule passes = authorized)

## Authorization Hierarchy

```
ADMIN
  └─ Full access to all resources
     
MANAGER
  └─ Can create/update/delete most resources
  └─ Can override USER permissions
     
USER
  └─ Can read most resources
  └─ Can update resources they created (e.g., NonConformance)
  └─ Can update resources assigned to them (e.g., CorrectiveAction)
```

## Resource Ownership

Resources track ownership through these fields:
- `createdById` - User who created the resource
- `reportedById` - User who reported the issue (NonConformance)
- `assignedToId` - User assigned to the resource (CorrectiveAction)

## Authorization Functions

### Basic Functions

```typescript
// Check authentication
requireAuthentication(user?: JWTPayload): JWTPayload

// Check specific role
requireRole(user: JWTPayload, allowedRoles: Role[]): void

// Check if user is admin
isAdmin(user: JWTPayload): boolean

// Check if user is manager or above
isManagerOrAbove(user: JWTPayload): boolean

// Check resource ownership
isResourceCreator(user: JWTPayload, resource: ResourceOwnership): boolean
isResourceAssignee(user: JWTPayload, resource: ResourceOwnership): boolean
hasResourceRelationship(user: JWTPayload, resource: ResourceOwnership): boolean
```

### Authorization Rule Builder

```typescript
const rule = new AuthorizationRule()
  .allowAdmin()                    // Allow ADMIN users
  .allowManagerOrAbove()           // Allow MANAGER and ADMIN
  .allowRoles(['USER'])            // Allow specific roles
  .allowCreator()                  // Allow resource creator
  .allowAssignee()                 // Allow assigned user
  .allowRelatedUser()              // Allow any relationship
  .allow((ctx) => customLogic())   // Custom rule

// Authorize (throws AuthorizationError if denied)
rule.authorize(createAuthContext(user, 'update', resource));

// Check without throwing
const isAuthorized = rule.check(createAuthContext(user, 'update', resource));
```

## Pre-defined Policies

### NonConformance

```typescript
AuthorizationPolicies.nonConformance.create()  // ADMIN, MANAGER, USER
AuthorizationPolicies.nonConformance.read()    // ADMIN, MANAGER, USER
AuthorizationPolicies.nonConformance.update()  // ADMIN, MANAGER, or creator
AuthorizationPolicies.nonConformance.delete()  // ADMIN only
```

**Key Feature**: Users can update NonConformances they reported

### CorrectiveAction

```typescript
AuthorizationPolicies.correctiveAction.create()  // ADMIN, MANAGER
AuthorizationPolicies.correctiveAction.read()    // ADMIN, MANAGER, USER
AuthorizationPolicies.correctiveAction.update()  // ADMIN, MANAGER, or assignee
AuthorizationPolicies.correctiveAction.delete()  // ADMIN only
```

**Key Feature**: Users can update CorrectiveActions assigned to them

### Document

```typescript
AuthorizationPolicies.document.create()  // ADMIN, MANAGER
AuthorizationPolicies.document.read()    // ADMIN, MANAGER, USER
AuthorizationPolicies.document.update()  // ADMIN, MANAGER, or creator
AuthorizationPolicies.document.delete()  // ADMIN only
```

**Key Feature**: Users can update Documents they created

### User Management

```typescript
AuthorizationPolicies.user.create()  // ADMIN only
AuthorizationPolicies.user.read()    // ADMIN, MANAGER
AuthorizationPolicies.user.update()  // ADMIN, or self
AuthorizationPolicies.user.delete()  // ADMIN only
```

## Service Layer Implementation

### Before (Static Role-Based)

```typescript
// Old approach - only ADMIN and MANAGER could update
private requireNonConformanceWriteRole(user?: JWTPayload): JWTPayload {
  const currentUser = this.requireAuthenticatedUser(user);
  if (!NON_CONFORMANCE_WRITE_ROLES.has(currentUser.role)) {
    throw new AuthorizationError('NonConformance write access requires ADMIN or MANAGER role');
  }
  return currentUser;
}

async updateNonConformance(id: string, input: UpdateInput, currentUser?: JWTPayload) {
  this.requireNonConformanceWriteRole(currentUser);
  // ... update logic
}
```

### After (Resource-Based)

```typescript
// New approach - ADMIN, MANAGER, or creator can update
async updateNonConformance(id: string, input: UpdateInput, currentUser?: JWTPayload) {
  const user = requireAuthentication(currentUser);
  const nonConformance = await this.repository.getNonConformanceById(id);
  
  if (!nonConformance) {
    throw new NotFoundError('Non-conformance not found');
  }
  
  // Resource-based authorization check
  AuthorizationPolicies.nonConformance.update().authorize(
    createAuthContext(user, 'update', { reportedById: nonConformance.reportedById })
  );
  
  return this.repository.updateNonConformance(id, input);
}
```

## Usage Examples

### Example 1: NonConformance Update

```typescript
// Scenario: USER tries to update their own NonConformance report

const user = { userId: 'user123', email: 'user@example.com', role: 'USER' };
const nonConformance = { 
  id: 'nc123', 
  reportedById: 'user123',  // Same as current user
  title: 'Quality Issue'
};

// This will succeed because user is the creator
await nonConformanceService.updateNonConformance('nc123', {
  title: 'Updated Quality Issue'
}, user);
```

### Example 2: CorrectiveAction Update

```typescript
// Scenario: USER tries to update a CorrectiveAction assigned to them

const user = { userId: 'user456', email: 'user@example.com', role: 'USER' };
const action = {
  id: 'ca123',
  assignedToId: 'user456',  // Assigned to current user
  status: 'PENDING'
};

// This will succeed because user is the assignee
await correctiveActionService.updateCorrectiveAction('ca123', {
  status: 'IN_PROGRESS'
}, user);
```

### Example 3: MANAGER Override

```typescript
// Scenario: MANAGER updates any resource (regardless of ownership)

const manager = { userId: 'mgr123', email: 'mgr@example.com', role: 'MANAGER' };
const nonConformance = {
  id: 'nc123',
  reportedById: 'user123',  // Created by different user
  title: 'Quality Issue'
};

// This will succeed because MANAGER can override
await nonConformanceService.updateNonConformance('nc123', {
  status: 'CLOSED'
}, manager);
```

### Example 4: Authorization Denied

```typescript
// Scenario: USER tries to update someone else's NonConformance

const user = { userId: 'user999', email: 'user@example.com', role: 'USER' };
const nonConformance = {
  id: 'nc123',
  reportedById: 'user123',  // Different user
  title: 'Quality Issue'
};

// This will throw AuthorizationError
await nonConformanceService.updateNonConformance('nc123', {
  title: 'Updated'
}, user);  // ❌ AuthorizationError: Insufficient permissions for this action
```

## Custom Authorization Rules

You can create custom rules for specific scenarios:

```typescript
// Example: Only allow updates during business hours
const businessHoursRule = new AuthorizationRule()
  .allowAdmin()
  .allow((ctx) => {
    const hour = new Date().getHours();
    return ctx.user.role === 'MANAGER' && hour >= 9 && hour < 17;
  });

// Example: Allow updates only for DRAFT status
const draftOnlyRule = new AuthorizationRule()
  .allowAdmin()
  .allow((ctx) => {
    return ctx.resource && 
           isResourceCreator(ctx.user, ctx.resource) && 
           (ctx.resource as any).status === 'DRAFT';
  });
```

## Testing Authorization

```typescript
import { AuthorizationRule, createAuthContext } from '@/shared/utils';

describe('Authorization', () => {
  it('should allow creator to update NonConformance', () => {
    const user = { userId: 'user123', email: 'user@test.com', role: 'USER' };
    const resource = { reportedById: 'user123' };
    
    const rule = AuthorizationPolicies.nonConformance.update();
    const ctx = createAuthContext(user, 'update', resource);
    
    expect(() => rule.authorize(ctx)).not.toThrow();
  });

  it('should deny non-creator USER from updating', () => {
    const user = { userId: 'user999', email: 'user@test.com', role: 'USER' };
    const resource = { reportedById: 'user123' };
    
    const rule = AuthorizationPolicies.nonConformance.update();
    const ctx = createAuthContext(user, 'update', resource);
    
    expect(() => rule.authorize(ctx)).toThrow(AuthorizationError);
  });
});
```

## Best Practices

### 1. Always Fetch Resource Before Authorization

```typescript
// ✅ Good - fetch resource first
const resource = await repository.getById(id);
if (!resource) throw new NotFoundError();
AuthorizationPolicies.resource.update().authorize(
  createAuthContext(user, 'update', resource)
);

// ❌ Bad - authorize without resource
AuthorizationPolicies.resource.update().authorize(
  createAuthContext(user, 'update')
);
```

### 2. Use Pre-defined Policies When Available

```typescript
// ✅ Good - use pre-defined policy
AuthorizationPolicies.nonConformance.update().authorize(ctx);

// ❌ Bad - recreate the same rule
new AuthorizationRule()
  .allowAdmin()
  .allowManagerOrAbove()
  .allowCreator()
  .authorize(ctx);
```

### 3. Validate Input Before Authorization

```typescript
// ✅ Good - validate first
CreateSchema.parse(input);
const user = requireAuthentication(currentUser);
AuthorizationPolicies.resource.create().authorize(ctx);

// ❌ Bad - authorize before validation
const user = requireAuthentication(currentUser);
AuthorizationPolicies.resource.create().authorize(ctx);
CreateSchema.parse(input);  // Wasted authorization check if invalid
```

### 4. Handle Authorization Errors Gracefully

```typescript
// Authorization errors are automatically thrown as AuthorizationError
// They will be caught by the global error handler and return 403 Forbidden
try {
  await service.updateResource(id, input, user);
} catch (error) {
  if (error instanceof AuthorizationError) {
    // Handle 403 Forbidden
  }
}
```

## Migration Guide

### Step 1: Update Imports

```typescript
// Before
import { AuthorizationError } from '@/shared/errors';
import { JWTPayload } from '@/shared/utils/jwt';

// After
import { 
  JWTPayload, 
  requireAuthentication, 
  AuthorizationPolicies, 
  createAuthContext 
} from '@/shared/utils';
```

### Step 2: Remove Role-Based Helper Methods

```typescript
// Remove these methods from services
private requireAuthenticatedUser(user?: JWTPayload): JWTPayload
private requireWriteRole(user?: JWTPayload): JWTPayload
```

### Step 3: Update Service Methods

```typescript
// Before
async update(id: string, input: Input, currentUser?: JWTPayload) {
  this.requireWriteRole(currentUser);
  await this.getById(id, currentUser);
  return this.repository.update(id, input);
}

// After
async update(id: string, input: Input, currentUser?: JWTPayload) {
  const user = requireAuthentication(currentUser);
  const resource = await this.repository.getById(id);
  
  if (!resource) throw new NotFoundError('Resource not found');
  
  AuthorizationPolicies.resource.update().authorize(
    createAuthContext(user, 'update', { 
      createdById: resource.createdById 
    })
  );
  
  return this.repository.update(id, input);
}
```

## Scalability Considerations

### 1. Performance
- Authorization checks are in-memory (no database calls)
- Rules are evaluated using OR logic (short-circuit on first match)
- Consider caching user roles if fetched from database

### 2. Extensibility
- Add new authorization rules without modifying existing code
- Create resource-specific policies as needed
- Combine multiple authorization strategies

### 3. Audit Trail
- Log authorization decisions for compliance
- Track who accessed what and when
- Integrate with AuditLog system

### 4. Testing
- Unit test authorization rules in isolation
- Integration test service methods with different user roles
- Test edge cases (null values, missing ownership)

## Future Enhancements

1. **Attribute-Based Access Control (ABAC)**
   - Time-based restrictions
   - Location-based access
   - Department-based permissions

2. **Permission Groups**
   - Group users with similar permissions
   - Assign permissions to groups instead of individual users

3. **Dynamic Permissions**
   - Load permissions from database
   - Allow runtime configuration
   - Support feature flags

4. **Fine-Grained Permissions**
   - Field-level access control
   - Action-specific permissions (e.g., can update status but not title)
   - Conditional permissions based on resource state

# Authorization System - Quick Reference

## Common Use Cases

### 1. Service Method Pattern

```typescript
async updateResource(id: string, input: Input, currentUser?: JWTPayload) {
  // 1. Authenticate
  const user = requireAuthentication(currentUser);
  
  // 2. Fetch resource
  const resource = await this.repository.getById(id);
  if (!resource) throw new NotFoundError('Resource not found');
  
  // 3. Authorize
  AuthorizationPolicies.resource.update().authorize(
    createAuthContext(user, 'update', { 
      createdById: resource.createdById 
    })
  );
  
  // 4. Execute
  return this.repository.update(id, input);
}
```

### 2. Check Permission Without Throwing

```typescript
const canUpdate = AuthorizationPolicies.resource.update().check(
  createAuthContext(user, 'update', resource)
);

if (canUpdate) {
  // Show edit button
}
```

### 3. Custom Authorization Rule

```typescript
const customRule = new AuthorizationRule()
  .allowAdmin()
  .allow((ctx) => {
    // Custom logic here
    return ctx.user.email.endsWith('@company.com');
  });

customRule.authorize(createAuthContext(user, 'action'));
```

## Resource Ownership Fields

| Field | Used By | Description |
|-------|---------|-------------|
| `createdById` | Document | User who created the document |
| `reportedById` | NonConformance | User who reported the issue |
| `assignedToId` | CorrectiveAction | User assigned to complete the action |

## Quick Authorization Checks

```typescript
// Is user admin?
isAdmin(user)

// Is user manager or above?
isManagerOrAbove(user)

// Did user create this resource?
isResourceCreator(user, { createdById: 'user-id' })

// Is user assigned to this resource?
isResourceAssignee(user, { assignedToId: 'user-id' })

// Does user have any relationship to resource?
hasResourceRelationship(user, resource)
```

## Pre-defined Policies

```typescript
// NonConformance
AuthorizationPolicies.nonConformance.create()  // Anyone
AuthorizationPolicies.nonConformance.read()    // Anyone
AuthorizationPolicies.nonConformance.update()  // Admin, Manager, Creator
AuthorizationPolicies.nonConformance.delete()  // Admin only

// CorrectiveAction
AuthorizationPolicies.correctiveAction.create()  // Admin, Manager
AuthorizationPolicies.correctiveAction.read()    // Anyone
AuthorizationPolicies.correctiveAction.update()  // Admin, Manager, Assignee
AuthorizationPolicies.correctiveAction.delete()  // Admin only

// Document
AuthorizationPolicies.document.create()  // Admin, Manager
AuthorizationPolicies.document.read()    // Anyone
AuthorizationPolicies.document.update()  // Admin, Manager, Creator
AuthorizationPolicies.document.delete()  // Admin only

// User
AuthorizationPolicies.user.create()  // Admin only
AuthorizationPolicies.user.read()    // Admin, Manager
AuthorizationPolicies.user.update()  // Admin, Self
AuthorizationPolicies.user.delete()  // Admin only
```

## Testing Example

```typescript
describe('Authorization', () => {
  it('allows creator to update', () => {
    const user = { userId: 'user1', email: 'user@test.com', role: 'USER' };
    const resource = { createdById: 'user1' };
    
    const rule = AuthorizationPolicies.resource.update();
    const ctx = createAuthContext(user, 'update', resource);
    
    expect(() => rule.authorize(ctx)).not.toThrow();
  });
});
```

## Common Errors

### ❌ Missing Resource in Context
```typescript
// Wrong - no resource ownership
AuthorizationPolicies.resource.update().authorize(
  createAuthContext(user, 'update')
);

// Right - include resource
AuthorizationPolicies.resource.update().authorize(
  createAuthContext(user, 'update', { createdById: resource.createdById })
);
```

### ❌ Authorizing Before Fetching
```typescript
// Wrong - authorize before fetching
AuthorizationPolicies.resource.update().authorize(ctx);
const resource = await repository.getById(id);

// Right - fetch first, then authorize
const resource = await repository.getById(id);
if (!resource) throw new NotFoundError();
AuthorizationPolicies.resource.update().authorize(
  createAuthContext(user, 'update', resource)
);
```

### ❌ Not Handling Null Resource
```typescript
// Wrong - resource might be null
const resource = await repository.getById(id);
AuthorizationPolicies.resource.update().authorize(
  createAuthContext(user, 'update', resource)
);

// Right - check for null first
const resource = await repository.getById(id);
if (!resource) throw new NotFoundError();
AuthorizationPolicies.resource.update().authorize(
  createAuthContext(user, 'update', resource)
);
```

## API Response Codes

| Error | Status Code | Description |
|-------|------------|-------------|
| `AuthorizationError` | 403 | User lacks permission |
| `AuthenticationError` | 401 | User not authenticated |
| `NotFoundError` | 404 | Resource not found |
| `ValidationError` | 400 | Invalid input |

## Performance Tips

1. ✅ Authorization is in-memory (no DB calls)
2. ✅ Rules short-circuit on first match
3. ✅ Reuse policy instances when possible
4. ✅ Batch authorization checks if checking multiple resources

## For More Information

- **Full Documentation**: `AUTHORIZATION.md`
- **Executive Summary**: `AUTHORIZATION_SUMMARY.md`
- **Code Examples**: `src/shared/utils/authorization.examples.ts`
- **Tests**: `src/__tests__/shared.authorization.test.ts`

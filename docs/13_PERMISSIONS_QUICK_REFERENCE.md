# Fine-Grained Permissions - Quick Reference

## Quick Import

```typescript
import {
  requirePermission,
  userHasPermission,
  authorizeAction,
  Resource,
  Action,
} from '@/shared/utils/permissions';
```

## Common Patterns

### 1. Simple Permission Check

```typescript
// Require permission (throws if denied)
requirePermission(user, 'document:approve');

// Boolean check
if (userHasPermission(user, 'document:approve')) {
  // Show UI
}
```

### 2. Combined Permission + Ownership

```typescript
const document = await getDocument(id);

authorizeAction({
  user,
  resource: Resource.DOCUMENT,
  action: Action.UPDATE,
  resourceData: { createdById: document.createdById },
});
```

### 3. Service Methods

```typescript
// Approve document
async approveDocument(user: JWTPayload, id: string) {
  requirePermission(user, 'document:approve');
  return await prisma.document.update({
    where: { id },
    data: { status: 'APPROVED', approvedById: user.userId },
  });
}

// Assign NC
async assignNC(user: JWTPayload, ncId: string, userId: string) {
  requirePermission(user, 'nonConformance:assign');
  return await prisma.nonConformance.update({
    where: { id: ncId },
    data: { assignedToId: userId },
  });
}

// Close NC
async closeNC(user: JWTPayload, id: string, resolution: string) {
  requirePermission(user, 'nonConformance:close');
  return await prisma.nonConformance.update({
    where: { id },
    data: { status: 'CLOSED', resolution, closedById: user.userId },
  });
}
```

## Permission Matrix

| Action | ADMIN | MANAGER | USER |
|--------|-------|---------|------|
| **Document** |
| create | ✅ | ✅ | ✅ |
| read | ✅ | ✅ | ✅ |
| update | ✅ | ✅ | ✅ (own) |
| delete | ✅ | ❌ | ❌ |
| approve | ✅ | ✅ | ❌ |
| archive | ✅ | ✅ | ❌ |
| export | ✅ | ✅ | ❌ |
| **Non-Conformance** |
| create | ✅ | ✅ | ✅ |
| read | ✅ | ✅ | ✅ |
| update | ✅ | ✅ | ✅ (own) |
| assign | ✅ | ✅ | ❌ |
| close | ✅ | ✅ | ❌ |
| approve | ✅ | ✅ | ❌ |
| investigate | ✅ | ✅ | ✅ (own) |
| **Corrective Action** |
| create | ✅ | ✅ | ❌ |
| read | ✅ | ✅ | ✅ |
| update | ✅ | ✅ | ✅ (assigned) |
| assign | ✅ | ✅ | ❌ |
| complete | ✅ | ✅ | ✅ (assigned) |
| verify | ✅ | ✅ | ❌ |
| approve | ✅ | ✅ | ❌ |
| **User Management** |
| create | ✅ | ❌ | ❌ |
| read | ✅ | ✅ | ✅ |
| update | ✅ | ✅ | ✅ (self) |
| delete | ✅ | ❌ | ❌ |
| **Scope Management** |
| create | ✅ | ❌ | ❌ |
| read | ✅ | ✅ | ✅ |
| update | ✅ | ❌ | ❌ |
| delete | ✅ | ❌ | ❌ |
| assign | ✅ | ❌ | ❌ |

## Helper Functions

```typescript
// Check if user can approve
if (isApprover(user, Resource.DOCUMENT)) { }

// Check if user can assign
if (canAssign(user, Resource.NON_CONFORMANCE)) { }

// Check if user can export
if (canExport(user, Resource.DOCUMENT)) { }

// Check if system admin
if (isSystemAdmin(user)) { }
```

## Permission Strings

### Document
- `document:create`
- `document:read`
- `document:update`
- `document:delete`
- `document:approve`
- `document:reject`
- `document:archive`
- `document:restore`
- `document:export`

### Non-Conformance
- `nonConformance:create`
- `nonConformance:read`
- `nonConformance:update`
- `nonConformance:delete`
- `nonConformance:assign`
- `nonConformance:reassign`
- `nonConformance:investigate`
- `nonConformance:close`
- `nonConformance:reopen`
- `nonConformance:approve`
- `nonConformance:reject`
- `nonConformance:archive`
- `nonConformance:export`
- `nonConformance:bulkUpdate` (ADMIN only)

### Corrective Action
- `correctiveAction:create`
- `correctiveAction:read`
- `correctiveAction:update`
- `correctiveAction:delete`
- `correctiveAction:assign`
- `correctiveAction:reassign`
- `correctiveAction:complete`
- `correctiveAction:verify`
- `correctiveAction:approve`
- `correctiveAction:reject`
- `correctiveAction:export`

### User
- `user:create`
- `user:read`
- `user:update`
- `user:delete`
- `user:list`
- `user:export`

### Scope
- `scope:create`
- `scope:read`
- `scope:update`
- `scope:delete`
- `scope:list`
- `scope:assign`

## GraphQL Resolver Example

```typescript
const resolvers = {
  Mutation: {
    approveDocument: async (_, { id }, { user }) => {
      requirePermission(user, 'document:approve');
      return documentService.approve(id);
    },
    
    assignNonConformance: async (_, { id, userId }, { user }) => {
      requirePermission(user, 'nonConformance:assign');
      return ncService.assign(id, userId);
    },
    
    closeNonConformance: async (_, { id, resolution }, { user }) => {
      requirePermission(user, 'nonConformance:close');
      return ncService.close(id, resolution);
    },
  },
};
```

## Middleware Example

```typescript
router.post(
  '/documents/:id/approve',
  authenticate, // JWT auth
  (req, res, next) => {
    try {
      requirePermission(req.user, 'document:approve');
      next();
    } catch (err) {
      res.status(403).json({ error: err.message });
    }
  },
  documentController.approve
);
```

## UI Helper

```typescript
const {
  canApproveDocument,
  canAssignNC,
  canCloseNC,
  canVerifyCA,
  canManageUsers,
} = getUIPermissions(user);

// Conditional rendering
{canApproveDocument && <ApproveButton />}
{canAssignNC && <AssignDialog />}
{canCloseNC && <CloseButton />}
```

## Testing

```bash
npm test -- shared.permissions.test.ts
```

All 67 permission tests pass ✅

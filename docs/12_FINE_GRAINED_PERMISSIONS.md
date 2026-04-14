# Fine-Grained Permission System

## Overview

This document describes the **fine-grained permission system** that extends the basic RBAC (Role-Based Access Control) with action-based permissions. Instead of simple CRUD operations, the system supports specific actions like `approve`, `assign`, `verify`, `archive`, etc.

## Table of Contents

1. [Architecture](#architecture)
2. [Permission Structure](#permission-structure)
3. [Role Permissions](#role-permissions)
4. [Usage Guide](#usage-guide)
5. [Integration Examples](#integration-examples)
6. [Migration Guide](#migration-guide)
7. [Best Practices](#best-practices)

---

## Architecture

### Permission Format

Permissions follow the format: `resource:action`

**Examples:**
- `document:approve` - Approve a document
- `nonConformance:assign` - Assign a non-conformance
- `correctiveAction:verify` - Verify a corrective action
- `user:delete` - Delete a user

### Resources

The system defines these core resources:

```typescript
enum Resource {
  NON_CONFORMANCE = 'nonConformance',
  CORRECTIVE_ACTION = 'correctiveAction',
  DOCUMENT = 'document',
  USER = 'user',
  SCOPE = 'scope',
  AUDIT = 'audit',
  TRAINING = 'training',
  SUPPLIER = 'supplier',
}
```

### Actions

Fine-grained actions beyond CRUD:

```typescript
enum Action {
  // Basic CRUD
  CREATE, READ, UPDATE, DELETE,
  
  // Listing
  LIST, SEARCH,
  
  // Assignment
  ASSIGN, REASSIGN, CLAIM,
  
  // Workflow
  SUBMIT, APPROVE, REJECT, REVIEW, VERIFY,
  
  // Status
  CLOSE, REOPEN, CANCEL, ARCHIVE, RESTORE,
  
  // Investigation
  INVESTIGATE, ANALYZE,
  
  // Completion
  COMPLETE, MARK_COMPLETE,
  
  // Administrative
  EXPORT, IMPORT, BULK_UPDATE, MANAGE_SETTINGS,
}
```

---

## Permission Structure

### ROLE_PERMISSIONS Map

All permissions are defined in a centralized map:

```typescript
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // Full access to all resources and actions
    'document:create', 'document:approve', 'document:delete',
    'nonConformance:assign', 'nonConformance:close',
    'user:create', 'user:delete',
    // ... all permissions
  ],
  
  MANAGER: [
    // Supervisory and approval permissions
    'document:approve', 'document:archive',
    'nonConformance:assign', 'nonConformance:close',
    'correctiveAction:verify', 'correctiveAction:approve',
    // ... manager permissions
  ],
  
  USER: [
    // Basic operational permissions
    'document:create', 'document:read', 'document:update',
    'nonConformance:create', 'nonConformance:investigate',
    'correctiveAction:complete',
    // ... user permissions
  ],
};
```

### Permission Groups

Common permission sets for convenience:

```typescript
const PERMISSION_GROUPS = {
  NC_MANAGER: ['nonConformance:assign', 'nonConformance:reassign', 'nonConformance:close'],
  DOCUMENT_APPROVER: ['document:approve', 'document:reject'],
  CA_VERIFIER: ['correctiveAction:verify', 'correctiveAction:approve'],
  SYSTEM_ADMIN: ['user:create', 'user:delete', 'scope:create'],
};
```

---

## Role Permissions

### ADMIN

**Full system access** - can perform all actions on all resources.

**Key Capabilities:**
- ✅ Create, update, delete any resource
- ✅ Approve, reject, archive documents
- ✅ Assign, reassign, close non-conformances
- ✅ Manage users (create, delete, update roles)
- ✅ Manage scopes
- ✅ Bulk operations
- ✅ System settings

**Example Permissions:**
```typescript
'document:create', 'document:approve', 'document:delete', 'document:archive',
'nonConformance:assign', 'nonConformance:close', 'nonConformance:approve',
'correctiveAction:verify', 'correctiveAction:approve',
'user:create', 'user:delete',
'scope:create', 'scope:delete',
'*:export', '*:bulkUpdate'
```

### MANAGER

**Supervisory and approval** - can manage workflows and approve actions.

**Key Capabilities:**
- ✅ Approve and reject documents
- ✅ Assign and reassign non-conformances
- ✅ Close and reopen non-conformances
- ✅ Verify and approve corrective actions
- ✅ Archive documents
- ✅ Export data
- ✅ Update user assignments
- ❌ Cannot create/delete users
- ❌ Cannot manage scopes
- ❌ Cannot delete resources

**Example Permissions:**
```typescript
'document:approve', 'document:reject', 'document:archive',
'nonConformance:assign', 'nonConformance:close', 'nonConformance:approve',
'correctiveAction:verify', 'correctiveAction:approve', 'correctiveAction:assign',
'user:read', 'user:update',
'*:export'
```

### USER

**Basic operational** - can create and manage own resources.

**Key Capabilities:**
- ✅ Create non-conformances and documents
- ✅ Update own resources
- ✅ Investigate own non-conformance reports
- ✅ Complete assigned corrective actions
- ✅ Read resources in their scope
- ❌ Cannot approve or reject
- ❌ Cannot assign resources
- ❌ Cannot close non-conformances
- ❌ Cannot verify corrective actions
- ❌ Cannot export data

**Example Permissions:**
```typescript
'document:create', 'document:read', 'document:update',
'nonConformance:create', 'nonConformance:investigate', 'nonConformance:update',
'correctiveAction:read', 'correctiveAction:update', 'correctiveAction:complete',
'user:read', 'user:update' // Only self
```

---

## Usage Guide

### Basic Permission Checks

#### Check if role has permission

```typescript
import { hasPermission } from '@/shared/utils/permissions';

const canApprove = hasPermission('MANAGER', 'document:approve');
// true
```

#### Check if user has permission

```typescript
import { userHasPermission } from '@/shared/utils/permissions';

const user = { id: '1', role: 'MANAGER', email: 'mgr@example.com' };
const canApprove = userHasPermission(user, 'document:approve');
// true
```

### Require Permission (Throw Error)

```typescript
import { requirePermission } from '@/shared/utils/permissions';

// In a service method
async approveDocument(user: JWTPayload, documentId: string) {
  // Throws AuthorizationError if user lacks permission
  requirePermission(user, 'document:approve');
  
  // Continue with approval logic...
}
```

### Check Multiple Permissions

```typescript
import { 
  userHasAllPermissions, 
  userHasAnyPermission 
} from '@/shared/utils/permissions';

// User must have ALL permissions
const canManage = userHasAllPermissions(user, [
  'document:create',
  'document:approve',
  'document:delete',
]);

// User must have ANY permission
const canModify = userHasAnyPermission(user, [
  'document:update',
  'document:approve',
]);
```

### Resource-Action Check

```typescript
import { canPerformAction, requireAction, Resource, Action } from '@/shared/utils/permissions';

// Boolean check
if (canPerformAction(user, Resource.DOCUMENT, Action.APPROVE)) {
  // Show approve button
}

// Throw error if cannot
requireAction(user, Resource.NON_CONFORMANCE, Action.ASSIGN);
```

### Helper Functions

```typescript
import { isApprover, canAssign, canExport } from '@/shared/utils/permissions';

// Check if user can approve documents
if (isApprover(user, Resource.DOCUMENT)) {
  // Show approval workflow
}

// Check if user can assign non-conformances
if (canAssign(user, Resource.NON_CONFORMANCE)) {
  // Show assignment UI
}

// Check if user can export
if (canExport(user, Resource.DOCUMENT)) {
  // Show export button
}
```

### Combined Permission + Ownership Check

```typescript
import { authorizeAction } from '@/shared/utils/permissions';

async updateDocument(user: JWTPayload, documentId: string, data: any) {
  const document = await getDocumentById(documentId);
  
  // Checks both permission AND ownership
  // ADMIN/MANAGER can update any document
  // USER can only update own documents
  authorizeAction({
    user,
    resource: Resource.DOCUMENT,
    action: Action.UPDATE,
    resourceData: {
      createdById: document.createdById,
    },
  });
  
  // Update logic...
}
```

---

## Integration Examples

### Service Layer

```typescript
class NonConformanceService {
  async assignNC(user: JWTPayload, ncId: string, assignToId: string) {
    // Require permission
    requirePermission(user, 'nonConformance:assign');
    
    // Assignment logic...
    return await prisma.nonConformance.update({
      where: { id: ncId },
      data: { assignedToId: assignToId },
    });
  }
  
  async closeNC(user: JWTPayload, ncId: string, resolution: string) {
    requirePermission(user, 'nonConformance:close');
    
    return await prisma.nonConformance.update({
      where: { id: ncId },
      data: { 
        status: 'CLOSED',
        resolution,
        closedById: user.id,
        closedAt: new Date(),
      },
    });
  }
  
  async approveNC(user: JWTPayload, ncId: string) {
    requirePermission(user, 'nonConformance:approve');
    
    return await prisma.nonConformance.update({
      where: { id: ncId },
      data: { 
        status: 'APPROVED',
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });
  }
}
```

### GraphQL Resolvers

```typescript
import { withPermission } from '@/shared/utils/permissions.examples';

const resolvers = {
  Mutation: {
    // Wrap resolver with permission check
    approveDocument: withPermission(
      'document:approve',
      async (_, { id }, { user }) => {
        // Approval logic
        return documentService.approve(id);
      }
    ),
    
    assignNonConformance: withPermission(
      'nonConformance:assign',
      async (_, { id, userId }, { user }) => {
        return ncService.assign(id, userId);
      }
    ),
  },
};
```

### REST API Middleware

```typescript
import { requirePermissionMiddleware } from '@/shared/utils/permissions.examples';

router.post(
  '/documents/:id/approve',
  requirePermissionMiddleware('document:approve'),
  async (req, res) => {
    const document = await documentService.approve(req.params.id);
    res.json(document);
  }
);

router.post(
  '/non-conformances/:id/close',
  requirePermissionMiddleware('nonConformance:close'),
  async (req, res) => {
    const nc = await ncService.close(req.params.id, req.body.resolution);
    res.json(nc);
  }
);
```

### UI Permission Helper

```typescript
import { getUIPermissions } from '@/shared/utils/permissions.examples';

// In your React/Vue component
const permissions = getUIPermissions(user);

<>
  {permissions.canApproveDocument && (
    <Button onClick={approveDocument}>Approve</Button>
  )}
  
  {permissions.canAssignNC && (
    <AssignmentDialog />
  )}
  
  {permissions.canExportDocuments && (
    <Button onClick={exportData}>Export</Button>
  )}
</>
```

---

## Migration Guide

### From Basic RBAC to Fine-Grained Permissions

**Before (Basic RBAC):**
```typescript
// Old approach: role-based checks
if (user.role === 'ADMIN' || user.role === 'MANAGER') {
  // Approve document
}
```

**After (Fine-Grained):**
```typescript
// New approach: permission-based checks
if (userHasPermission(user, 'document:approve')) {
  // Approve document
}
```

### Step-by-Step Migration

1. **Identify current authorization points**
   - Find all `if (user.role === ...)` checks
   - Find all role-based middleware
   - Find all authorization logic in services

2. **Map to new permissions**
   ```typescript
   // Old: user.role === 'ADMIN'
   // New: userHasPermission(user, 'resource:action')
   
   // Old: isManagerOrAbove(user)
   // New: userHasPermission(user, 'document:approve')
   ```

3. **Update service methods**
   ```typescript
   // Before
   async approveDocument(user: JWTPayload, id: string) {
     if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
       throw new AuthorizationError();
     }
     // ...
   }
   
   // After
   async approveDocument(user: JWTPayload, id: string) {
     requirePermission(user, 'document:approve');
     // ...
   }
   ```

4. **Update middleware**
   ```typescript
   // Before
   router.post('/approve', requireRole(['ADMIN', 'MANAGER']), handler);
   
   // After
   router.post('/approve', requirePermissionMiddleware('document:approve'), handler);
   ```

5. **Add new workflow actions**
   ```typescript
   // Add new methods for specific actions
   async assignNC(user: JWTPayload, ncId: string, userId: string) {
     requirePermission(user, 'nonConformance:assign');
     // ...
   }
   
   async closeNC(user: JWTPayload, ncId: string) {
     requirePermission(user, 'nonConformance:close');
     // ...
   }
   ```

---

## Best Practices

### 1. Use Permission Checks, Not Role Checks

❌ **Bad:**
```typescript
if (user.role === 'MANAGER') {
  // Do something
}
```

✅ **Good:**
```typescript
if (userHasPermission(user, 'document:approve')) {
  // Do something
}
```

**Why:** Permissions are more flexible and allow fine-grained control. If you add new roles or change role permissions, permission-based checks don't need to change.

### 2. Fail Early with `require*` Functions

✅ **Good:**
```typescript
async approveDocument(user: JWTPayload, id: string) {
  requirePermission(user, 'document:approve');
  // All code after this assumes user has permission
  const document = await getDocument(id);
  // ...
}
```

**Why:** Throws early, preventing unnecessary database queries or logic execution.

### 3. Use `authorizeAction` for Resource Ownership

✅ **Good:**
```typescript
async updateDocument(user: JWTPayload, id: string, data: any) {
  const document = await getDocument(id);
  
  authorizeAction({
    user,
    resource: Resource.DOCUMENT,
    action: Action.UPDATE,
    resourceData: { createdById: document.createdById },
  });
  
  // Update logic...
}
```

**Why:** Combines permission check with ownership validation. ADMIN/MANAGER can update any document, USER can only update own.

### 4. Separate Read from Write Permissions

Different actions for different workflows:
- `document:read` - View document
- `document:update` - Edit document
- `document:approve` - Approve document (workflow action)
- `document:archive` - Archive document (admin action)

### 5. Use Helper Functions for Common Checks

```typescript
// Instead of
if (userHasPermission(user, 'document:approve')) { }

// Use
if (isApprover(user, Resource.DOCUMENT)) { }
```

### 6. Cache User Permissions in JWT

```typescript
// In JWT payload
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  permissions?: Permission[]; // Cache for performance
}
```

### 7. Document Custom Permissions

When adding new permissions, update the `ROLE_PERMISSIONS` map and document the use case:

```typescript
// Add to ADMIN permissions
'document:publishExternal', // Publish document to external portal
```

### 8. Use Permission Groups for Related Checks

```typescript
// Check multiple related permissions
const canManageNCs = userHasAllPermissions(
  user,
  PERMISSION_GROUPS.NC_MANAGER
);
```

---

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `hasPermission(role, permission)` | Check if role has permission |
| `userHasPermission(user, permission)` | Check if user has permission |
| `requirePermission(user, permission)` | Require permission or throw error |
| `canPerformAction(user, resource, action)` | Check if user can perform action on resource |
| `authorizeAction(context)` | Combined permission + ownership check |

### Multi-Permission Functions

| Function | Description |
|----------|-------------|
| `userHasAllPermissions(user, permissions[])` | User has ALL permissions |
| `userHasAnyPermission(user, permissions[])` | User has ANY permission |
| `requireAllPermissions(user, permissions[])` | Require all or throw |
| `requireAnyPermission(user, permissions[])` | Require at least one or throw |

### Helper Functions

| Function | Description |
|----------|-------------|
| `isApprover(user, resource)` | Can user approve resource |
| `canAssign(user, resource)` | Can user assign resource |
| `canExport(user, resource)` | Can user export resource |
| `isSystemAdmin(user)` | Is user system admin |
| `getUserPermissions(user)` | Get all user permissions |
| `getPermissionBreakdown(user)` | Get permissions grouped by resource |

---

## Testing

The permission system includes comprehensive tests:

```bash
npm test -- shared.permissions.test.ts
```

**Test coverage:**
- ✅ Permission constant definitions
- ✅ Role permission assignments
- ✅ Permission check functions
- ✅ Multi-permission checks
- ✅ Require functions (error throwing)
- ✅ Helper functions
- ✅ Combined authorization
- ✅ Workflow-specific scenarios

---

## Summary

The fine-grained permission system provides:

✅ **Action-based permissions** beyond CRUD  
✅ **Flexible role management** with centralized permission map  
✅ **Easy integration** with services, resolvers, and middleware  
✅ **Ownership validation** combined with permissions  
✅ **Type-safe** permission strings  
✅ **Comprehensive testing** and documentation  
✅ **Future-proof** - easy to add new permissions and roles  

**Next Steps:**
1. Review permission assignments for each role
2. Integrate into existing services
3. Add permission checks to GraphQL resolvers
4. Update UI to hide/show features based on permissions
5. Test thoroughly with different user roles

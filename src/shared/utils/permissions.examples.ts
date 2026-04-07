/**
 * Fine-Grained Permission System - Usage Examples
 * 
 * This file demonstrates how to use the permission system in your services,
 * controllers, and middleware.
 */

import { JWTPayload } from './jwt';
import {
  Resource,
  Action,
  hasPermission,
  userHasPermission,
  requirePermission,
  requireAnyPermission,
  canPerformAction,
  requireAction,
  isApprover,
  canAssign,
  authorizeAction,
  getUserPermissions,
  getPermissionBreakdown,
} from './permissions';

// ============================================================================
// Example 1: Basic Permission Checks
// ============================================================================

export function example1_BasicChecks() {
  // Check by role
  const isManagerApprover = hasPermission('MANAGER', 'document:approve');
  console.log('Manager can approve documents:', isManagerApprover); // true
  
  const isUserApprover = hasPermission('USER', 'document:approve');
  console.log('User can approve documents:', isUserApprover); // false
  
  // Check by user object
  const manager: JWTPayload = {
    id: '123',
    email: 'manager@example.com',
    role: 'MANAGER',
  };
  
  const canApprove = userHasPermission(manager, 'document:approve');
  console.log('This manager can approve:', canApprove); // true
}

// ============================================================================
// Example 2: Document Service with Fine-Grained Permissions
// ============================================================================

class DocumentService {
  /**
   * Create a new document
   * Only users with document:create permission can create
   */
  async createDocument(user: JWTPayload, data: any) {
    // Require permission
    requirePermission(user, 'document:create');
    
    // Create document logic...
    console.log('Document created by:', user.email);
    
    return { userId: '1', ...data, createdById: user.id };
  }
  
  /**
   * Update a document
   * Users can update their own, managers can update any
   */
  async updateDocument(user: JWTPayload, documentId: string, data: any) {
    // Get the document
    const document = await this.getDocumentById(documentId);
    
    // Use authorizeAction for combined permission + ownership check
    authorizeAction({
      user,
      resource: Resource.DOCUMENT,
      action: Action.UPDATE,
      resourceData: {
        createdById: document.createdById,
      },
    });
    
    // Update logic...
    console.log('Document updated');
    
    return { ...document, ...data };
  }
  
  /**
   * Approve a document
   * Only users with document:approve permission
   */
  async approveDocument(user: JWTPayload, documentId: string) {
    // Check approval permission
    requirePermission(user, 'document:approve');
    
    const document = await this.getDocumentById(documentId);
    
    // Approve logic...
    console.log('Document approved by:', user.email);
    
    return { ...document, status: 'APPROVED', approvedById: user.id };
  }
  
  /**
   * Archive a document
   * Only MANAGER and ADMIN can archive
   */
  async archiveDocument(user: JWTPayload, documentId: string) {
    requirePermission(user, 'document:archive');
    
    const document = await this.getDocumentById(documentId);
    
    // Archive logic...
    console.log('Document archived');
    
    return { ...document, isArchived: true };
  }
  
  /**
   * Export documents
   * Only users with export permission
   */
  async exportDocuments(user: JWTPayload, filters: any) {
    requirePermission(user, 'document:export');
    
    // Export logic...
    console.log('Exporting documents');
    
    return { exportUrl: 'https://...' };
  }
  
  private async getDocumentById(id: string) {
    return { id, createdById: '123', name: 'Doc 1' };
  }
}

// ============================================================================
// Example 3: Non-Conformance Service with Workflow Actions
// ============================================================================

class NonConformanceService {
  /**
   * Assign a non-conformance to a user
   * Only MANAGER and ADMIN can assign
   */
  async assignNonConformance(
    user: JWTPayload,
    ncId: string,
    assignToUserId: string
  ) {
    // Check assignment permission
    requirePermission(user, 'nonConformance:assign');
    
    // Assignment logic...
    console.log(`NC ${ncId} assigned to ${assignToUserId} by ${user.email}`);
    
    return { id: ncId, assignedToId: assignToUserId };
  }
  
  /**
   * Close a non-conformance
   * Only MANAGER and ADMIN can close
   */
  async closeNonConformance(user: JWTPayload, ncId: string, resolution: string) {
    requirePermission(user, 'nonConformance:close');
    
    // Close logic...
    console.log(`NC ${ncId} closed by ${user.email}`);
    
    return { id: ncId, status: 'CLOSED', resolution, closedById: user.id };
  }
  
  /**
   * Investigate a non-conformance
   * Users can investigate their own reports, managers can investigate any
   */
  async investigateNonConformance(user: JWTPayload, ncId: string, findings: string) {
    const nc = await this.getNCById(ncId);
    
    authorizeAction({
      user,
      resource: Resource.NON_CONFORMANCE,
      action: Action.INVESTIGATE,
      resourceData: {
        reportedById: nc.reportedById,
        assignedToId: nc.assignedToId,
      },
    });
    
    // Investigation logic...
    console.log('Investigation findings added');
    
    return { ...nc, findings };
  }
  
  private async getNCById(id: string) {
    return { id, reportedById: '123', assignedToId: '456' };
  }
}

// ============================================================================
// Example 4: Corrective Action Service with Verification
// ============================================================================

class CorrectiveActionService {
  /**
   * Complete a corrective action
   * Only assigned user can mark as complete
   */
  async completeCorrectiveAction(user: JWTPayload, caId: string, evidence: string) {
    const ca = await this.getCAById(caId);
    
    // Users can complete assigned actions
    authorizeAction({
      user,
      resource: Resource.CORRECTIVE_ACTION,
      action: Action.COMPLETE,
      resourceData: {
        assignedToId: ca.assignedToId,
      },
    });
    
    // Complete logic...
    console.log('Corrective action completed by assignee');
    
    return { ...ca, status: 'COMPLETED', evidence };
  }
  
  /**
   * Verify a corrective action
   * Only MANAGER and ADMIN can verify
   */
  async verifyCorrectiveAction(user: JWTPayload, caId: string, approved: boolean) {
    // Check verification permission
    requirePermission(user, 'correctiveAction:verify');
    
    const ca = await this.getCAById(caId);
    
    // Verify logic...
    console.log(`CA verified by ${user.email}: ${approved ? 'APPROVED' : 'REJECTED'}`);
    
    return {
      ...ca,
      status: approved ? 'VERIFIED' : 'REJECTED',
      verifiedById: user.id,
    };
  }
  
  private async getCAById(id: string) {
    return { userId: '1', assignedToId: '123' };
  }
}

// ============================================================================
// Example 5: User Management Service
// ============================================================================

class UserService {
  /**
   * Update user profile
   * Users can update their own profile, ADMIN can update any
   */
  async updateUser(user: JWTPayload, userId: string, updates: any) {
    const targetUser = await this.getUserById(userId);
    
    // Check if user is updating themselves or has permission
    if (user.id !== userId) {
      requirePermission(user, 'user:update');
    }
    
    // Update logic...
    console.log('User updated');
    
    return { ...targetUser, ...updates };
  }
  
  /**
   * Delete a user
   * Only ADMIN can delete users
   */
  async deleteUser(user: JWTPayload, userId: string) {
    requirePermission(user, 'user:delete');
    
    // Delete logic...
    console.log(`User ${userId} deleted by ${user.email}`);
    
    return true;
  }
  
  /**
   * List all users
   * Everyone can list, but might filter based on scope
   */
  async listUsers(user: JWTPayload) {
    requirePermission(user, 'user:list');
    
    // List logic...
    return [];
  }
  
  private async getUserById(id: string) {
    return { id, email: 'user@example.com', role: 'USER' };
  }
}

// ============================================================================
// Example 6: Middleware for Permission Checking
// ============================================================================

/**
 * Express/GraphQL middleware to check permissions
 */
export function requirePermissionMiddleware(permission: any) {
  return (req: any, res: any, next: any) => {
    const user = req.user; // From JWT middleware
    
    try {
      requirePermission(user, permission);
      next();
    } catch (error) {
      res.status(403).json({ error: 'Permission denied' });
    }
  };
}

/**
 * GraphQL resolver wrapper for permission checking
 */
export function withPermission(permission: any, resolver: Function) {
  return async (parent: any, args: any, context: any, info: any) => {
    const user = context.user;
    requirePermission(user, permission);
    
    return resolver(parent, args, context, info);
  };
}

// Example usage in GraphQL resolvers
const documentResolvers = {
  Mutation: {
    approveDocument: withPermission(
      'document:approve',
      async (_: any, { id }: any, { user }: any) => {
        // Approval logic...
        return { id, status: 'APPROVED' };
      }
    ),
  },
};

// ============================================================================
// Example 7: Conditional UI Rendering Helper
// ============================================================================

/**
 * Get permissions for UI rendering
 * Returns what the user can do for each resource
 */
export function getUIPermissions(user: JWTPayload) {
  return {
    // Documents
    canCreateDocument: userHasPermission(user, 'document:create'),
    canApproveDocument: isApprover(user, Resource.DOCUMENT),
    canArchiveDocument: userHasPermission(user, 'document:archive'),
    canExportDocuments: userHasPermission(user, 'document:export'),
    
    // Non-Conformances
    canCreateNC: userHasPermission(user, 'nonConformance:create'),
    canAssignNC: canAssign(user, Resource.NON_CONFORMANCE),
    canCloseNC: userHasPermission(user, 'nonConformance:close'),
    canApproveNC: isApprover(user, Resource.NON_CONFORMANCE),
    
    // Corrective Actions
    canVerifyCA: userHasPermission(user, 'correctiveAction:verify'),
    canCompleteCA: userHasPermission(user, 'correctiveAction:complete'),
    
    // User Management
    canManageUsers: userHasPermission(user, 'user:delete'),
    canCreateUsers: userHasPermission(user, 'user:create'),
    
    // Scope Management
    canManageScopes: userHasPermission(user, 'scope:create'),
    
    // System
    isSystemAdmin: userHasPermission(user, 'user:delete') && 
                   userHasPermission(user, 'scope:delete'),
  };
}

// ============================================================================
// Example 8: Permission Debugging
// ============================================================================

export function debugUserPermissions(user: JWTPayload) {
  console.log('\n=== User Permission Report ===');
  console.log(`User: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log('\nAll Permissions:');
  
  const permissions = getUserPermissions(user);
  permissions.forEach(p => console.log(`  ✓ ${p}`));
  
  console.log('\nPermission Breakdown:');
  const breakdown = getPermissionBreakdown(user);
  Object.entries(breakdown).forEach(([resource, actions]) => {
    console.log(`  ${resource}:`);
    actions.forEach(action => console.log(`    - ${action}`));
  });
  
  console.log('\nKey Capabilities:');
  console.log(`  Can approve documents: ${isApprover(user, Resource.DOCUMENT)}`);
  console.log(`  Can assign NCs: ${canAssign(user, Resource.NON_CONFORMANCE)}`);
  console.log(`  Can export data: ${canPerformAction(user, Resource.DOCUMENT, Action.EXPORT)}`);
}

// ============================================================================
// Example 9: Bulk Operations with Permission Checks
// ============================================================================

class BulkOperationsService {
  /**
   * Bulk approve documents
   * Only users with approval permission
   */
  async bulkApproveDocuments(user: JWTPayload, documentIds: string[]) {
    requirePermission(user, 'document:approve');
    
    const results = [];
    for (const id of documentIds) {
      // Approve each document
      results.push({ id, status: 'APPROVED' });
    }
    
    console.log(`Bulk approved ${results.length} documents`);
    return results;
  }
  
  /**
   * Bulk update with different permissions
   */
  async bulkUpdateNonConformances(user: JWTPayload, updates: any[]) {
    // Check if user has bulk update permission (ADMIN only)
    requirePermission(user, 'nonConformance:bulkUpdate');
    
    // Bulk update logic...
    console.log(`Bulk updated ${updates.length} non-conformances`);
    
    return updates;
  }
}

// ============================================================================
// Example 10: Permission-Based API Routes
// ============================================================================

/**
 * Example Express routes with permission guards
 */
export function setupPermissionRoutes(app: any) {
  // Approve document - requires permission
  app.post(
    '/api/documents/:id/approve',
    requirePermissionMiddleware('document:approve'),
    async (req: any, res: any) => {
      // Approval logic...
      res.json({ success: true });
    }
  );
  
  // Export documents - requires permission
  app.get(
    '/api/documents/export',
    requirePermissionMiddleware('document:export'),
    async (req: any, res: any) => {
      // Export logic...
      res.json({ exportUrl: 'https://...' });
    }
  );
  
  // Close NC - requires permission
  app.post(
    '/api/non-conformances/:id/close',
    requirePermissionMiddleware('nonConformance:close'),
    async (req: any, res: any) => {
      // Close logic...
      res.json({ success: true });
    }
  );
}

// ============================================================================
// Run Examples
// ============================================================================

if (require.main === module) {
  console.log('\n📋 Fine-Grained Permission System Examples\n');
  
  const adminUser: JWTPayload = {
    userId: '1',
    email: 'admin@example.com',
    role: 'ADMIN',
  };
  
  const managerUser: JWTPayload = {
    userId: '2',
    email: 'manager@example.com',
    role: 'MANAGER',
  };
  
  const regularUser: JWTPayload = {
    userId: '3',
    email: 'user@example.com',
    role: 'USER',
  };
  
  // Debug permissions for each role
  debugUserPermissions(adminUser);
  debugUserPermissions(managerUser);
  debugUserPermissions(regularUser);
  
  // Test basic checks
  example1_BasicChecks();
  
  // Test UI permissions
  console.log('\n=== UI Permissions for Manager ===');
  console.log(getUIPermissions(managerUser));
}

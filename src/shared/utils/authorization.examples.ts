/**
 * Authorization System Usage Examples
 * 
 * This file demonstrates practical usage of the resource-based authorization system
 */

import {
  requireAuthentication,
  AuthorizationPolicies,
  AuthorizationRule,
  createAuthContext,
  isAdmin,
  isManagerOrAbove,
  isResourceCreator,
  isResourceAssignee,
} from '@/shared/utils/authorization';
import { JWTPayload } from '@/shared/utils/jwt';

// ============================================================================
// EXAMPLE 1: Basic Service Method with Resource-Based Authorization
// ============================================================================

export class ExampleService {
  private repository: any; // Mock repository for examples

  async updateNonConformance(
    id: string,
    input: { title?: string; status?: string },
    currentUser?: JWTPayload
  ) {
    // Step 1: Authenticate user
    const user = requireAuthentication(currentUser);

    // Step 2: Fetch the resource
    const nonConformance = await this.getNonConformanceById(id);
    if (!nonConformance) {
      throw new Error('NonConformance not found');
    }

    // Step 3: Authorize (ADMIN, MANAGER, or creator can update)
    AuthorizationPolicies.nonConformance.update().authorize(
      createAuthContext(user, 'update', {
        reportedById: nonConformance.reportedById,
      })
    );

    // Step 4: Proceed with update
    return await this.repository.update(id, input);
  }

  // Helper method (implementation not shown)
  private async getNonConformanceById(id: string): Promise<any> {
    return { id, reportedById: 'user123', title: 'Sample NC' };
  }
}

// ============================================================================
// EXAMPLE 2: CorrectiveAction with Assignee-Based Authorization
// ============================================================================

export class CorrectiveActionExample {
  private repository: any; // Mock repository for examples

  async completeAction(id: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Fetch action with assignee information
    const action = await this.getActionById(id);
    if (!action) {
      throw new Error('Action not found');
    }

    // Check if action is already completed
    if (action.status === 'DONE') {
      throw new Error('Action already completed');
    }

    // ADMIN, MANAGER, or assigned user can complete
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(user, 'update', {
        assignedToId: action.assignedToId,
      })
    );

    return await this.repository.complete(id);
  }

  private async getActionById(id: string): Promise<any> {
    return { id, assignedToId: 'user456', status: 'IN_PROGRESS' };
  }
}

// ============================================================================
// EXAMPLE 3: Custom Authorization Rules
// ============================================================================

export class CustomAuthExample {
  private repository: any; // Mock repository for examples

  /**
   * Example: Only allow document updates if in DRAFT status
   */
  async updateDraftDocument(
    id: string,
    input: { title?: string; content?: string },
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);
    const document = await this.getDocumentById(id);

    if (!document) {
      throw new Error('Document not found');
    }

    // Custom rule: Only ADMIN, MANAGER, or creator can update DRAFT documents
    const draftUpdateRule = new AuthorizationRule()
      .allowAdmin()
      .allowManagerOrAbove()
      .allow((ctx) => {
        // Allow creator only if status is DRAFT
        return (
          isResourceCreator(ctx.user, ctx.resource!) &&
          (ctx.resource as any).status === 'DRAFT'
        );
      });

    draftUpdateRule.authorize(
      createAuthContext(user, 'update', {
        createdById: document.createdById,
        status: document.status,
      } as any)
    );

    return await this.repository.update(id, input);
  }

  /**
   * Example: Time-based authorization (business hours only)
   */
  async sensitiveOperation(currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    const businessHoursRule = new AuthorizationRule()
      .allowAdmin() // ADMIN can always access
      .allow((ctx) => {
        // MANAGER only during business hours (9 AM - 5 PM)
        if (ctx.user.role === 'MANAGER') {
          const hour = new Date().getHours();
          return hour >= 9 && hour < 17;
        }
        return false;
      });

    businessHoursRule.authorize(createAuthContext(user, 'update'));

    // Proceed with operation
    return { success: true };
  }

  /**
   * Example: Check authorization without throwing
   */
  async conditionalAccess(resourceId: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);
    const resource = await this.getResourceById(resourceId);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // Check if user can update without throwing error
    const canUpdate = AuthorizationPolicies.document.update().check(
      createAuthContext(user, 'update', {
        createdById: resource.createdById,
      })
    );

    return {
      resource,
      permissions: {
        canUpdate,
        canDelete: isAdmin(user),
        isOwner: isResourceCreator(user, { createdById: resource.createdById }),
      },
    };
  }

  private async getDocumentById(id: string): Promise<any> {
    return { id, createdById: 'user123', status: 'DRAFT', title: 'Sample Doc' };
  }

  private async getResourceById(id: string): Promise<any> {
    return { id, createdById: 'user123' };
  }
}

// ============================================================================
// EXAMPLE 4: Multi-Step Authorization Flow
// ============================================================================

export class WorkflowExample {
  private repository: any; // Mock repository for examples

  /**
   * Example: Close NonConformance (multi-step authorization)
   * - Must have completed all CorrectiveActions
   * - Must be ADMIN, MANAGER, or creator
   */
  async closeNonConformance(id: string, currentUser?: JWTPayload) {
    const user = requireAuthentication(currentUser);

    // Step 1: Fetch NonConformance with related actions
    const nc = await this.getNonConformanceWithActions(id);
    if (!nc) {
      throw new Error('NonConformance not found');
    }

    // Step 2: Business rule validation
    const hasIncompleteActions = nc.actions.some(
      (action: any) => action.status !== 'DONE'
    );
    if (hasIncompleteActions) {
      throw new Error('Cannot close: incomplete corrective actions remain');
    }

    // Step 3: Authorization check
    AuthorizationPolicies.nonConformance.update().authorize(
      createAuthContext(user, 'update', {
        reportedById: nc.reportedById,
      })
    );

    // Step 4: Execute closure
    return await this.repository.close(id);
  }

  /**
   * Example: Reassign CorrectiveAction
   * - Only ADMIN and MANAGER can reassign
   */
  async reassignAction(
    actionId: string,
    newAssigneeId: string,
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);

    // Only ADMIN and MANAGER can reassign
    const reassignRule = new AuthorizationRule()
      .allowAdmin()
      .allowManagerOrAbove();

    reassignRule.authorize(createAuthContext(user, 'update'));

    return await this.repository.reassign(actionId, newAssigneeId);
  }

  private async getNonConformanceWithActions(id: string): Promise<any> {
    return {
      id,
      reportedById: 'user123',
      status: 'RESOLVED',
      actions: [{ id: 'ca1', status: 'DONE' }],
    };
  }
}

// ============================================================================
// EXAMPLE 5: Helper Functions for UI Permissions
// ============================================================================

export class PermissionHelper {
  /**
   * Get user's permissions for a specific resource
   * Useful for UI to show/hide buttons
   */
  static getResourcePermissions(
    resource: { createdById?: string; assignedToId?: string },
    currentUser: JWTPayload
  ) {
    const canRead = AuthorizationPolicies.nonConformance.read().check(
      createAuthContext(currentUser, 'read', resource)
    );

    const canUpdate = AuthorizationPolicies.nonConformance.update().check(
      createAuthContext(currentUser, 'update', resource)
    );

    const canDelete = AuthorizationPolicies.nonConformance.delete().check(
      createAuthContext(currentUser, 'delete', resource)
    );

    return {
      canRead,
      canUpdate,
      canDelete,
      isOwner: isResourceCreator(currentUser, resource),
      isAssignee: isResourceAssignee(currentUser, resource),
      isAdmin: isAdmin(currentUser),
      isManager: isManagerOrAbove(currentUser),
    };
  }

  /**
   * Bulk permission check for list views
   */
  static async enrichWithPermissions(
    resources: Array<{ id: string; createdById: string }>,
    currentUser: JWTPayload
  ) {
    return resources.map((resource) => ({
      ...resource,
      permissions: this.getResourcePermissions(resource, currentUser),
    }));
  }
}

// ============================================================================
// EXAMPLE 6: Testing Authorization
// ============================================================================

export class AuthorizationTests {
  /**
   * Test: USER can update their own NonConformance
   */
  static testUserCanUpdateOwnNC() {
    const user: JWTPayload = {
      userId: 'user123',
      email: 'user@test.com',
      role: 'USER',
    };

    const nc = { reportedById: 'user123' };

    try {
      AuthorizationPolicies.nonConformance.update().authorize(
        createAuthContext(user, 'update', nc)
      );
      console.log('✓ USER can update own NonConformance');
    } catch (error) {
      console.log('✗ Test failed:', error);
    }
  }

  /**
   * Test: USER cannot update others' NonConformance
   */
  static testUserCannotUpdateOthersNC() {
    const user: JWTPayload = {
      userId: 'user999',
      email: 'user@test.com',
      role: 'USER',
    };

    const nc = { reportedById: 'user123' };

    try {
      AuthorizationPolicies.nonConformance.update().authorize(
        createAuthContext(user, 'update', nc)
      );
      console.log('✗ Test failed: should have thrown');
    } catch (error) {
      console.log('✓ USER correctly denied from updating others NC');
    }
  }

  /**
   * Test: MANAGER can update any NonConformance
   */
  static testManagerCanUpdateAnyNC() {
    const manager: JWTPayload = {
      userId: 'mgr123',
      email: 'mgr@test.com',
      role: 'MANAGER',
    };

    const nc = { reportedById: 'user123' };

    try {
      AuthorizationPolicies.nonConformance.update().authorize(
        createAuthContext(manager, 'update', nc)
      );
      console.log('✓ MANAGER can update any NonConformance');
    } catch (error) {
      console.log('✗ Test failed:', error);
    }
  }

  /**
   * Test: USER can update assigned CorrectiveAction
   */
  static testUserCanUpdateAssignedAction() {
    const user: JWTPayload = {
      userId: 'user456',
      email: 'user@test.com',
      role: 'USER',
    };

    const action = { assignedToId: 'user456' };

    try {
      AuthorizationPolicies.correctiveAction.update().authorize(
        createAuthContext(user, 'update', action)
      );
      console.log('✓ USER can update assigned CorrectiveAction');
    } catch (error) {
      console.log('✗ Test failed:', error);
    }
  }

  /**
   * Run all tests
   */
  static runAllTests() {
    console.log('\n=== Authorization Tests ===\n');
    this.testUserCanUpdateOwnNC();
    this.testUserCannotUpdateOthersNC();
    this.testManagerCanUpdateAnyNC();
    this.testUserCanUpdateAssignedAction();
    console.log('\n=========================\n');
  }
}

// ============================================================================
// EXAMPLE 7: Real-World Scenarios
// ============================================================================

export class RealWorldScenarios {
  /**
   * Scenario: Quality inspector creates NC, manager assigns action, user completes it
   */
  static async qualityWorkflow() {
    // Step 1: Quality inspector (USER) creates NonConformance
    const inspector: JWTPayload = {
      userId: 'inspector1',
      email: 'inspector@company.com',
      role: 'USER',
    };

    console.log('1. Inspector creates NonConformance');
    // Inspector creates NC - authorized because all users can create

    // Step 2: Inspector tries to assign corrective action (should fail)
    console.log('2. Inspector tries to assign action (should fail)');
    try {
      AuthorizationPolicies.correctiveAction.create().authorize(
        createAuthContext(inspector, 'create')
      );
      console.log('✗ Should not allow USER to create actions');
    } catch (error) {
      console.log('✓ Correctly denied - only ADMIN/MANAGER can create actions');
    }

    // Step 3: Manager assigns corrective action
    const manager: JWTPayload = {
      userId: 'manager1',
      email: 'manager@company.com',
      role: 'MANAGER',
    };

    console.log('3. Manager assigns corrective action');
    AuthorizationPolicies.correctiveAction.create().authorize(
      createAuthContext(manager, 'create')
    );
    console.log('✓ Action assigned to technician');

    // Step 4: Technician (USER) updates action status
    const technician: JWTPayload = {
      userId: 'tech1',
      email: 'tech@company.com',
      role: 'USER',
    };

    console.log('4. Technician updates action status');
    const action = { assignedToId: 'tech1' };
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(technician, 'update', action)
    );
    console.log('✓ Technician marks action as IN_PROGRESS');

    // Step 5: Inspector closes NonConformance (their own)
    console.log('5. Inspector closes NonConformance');
    const nc = { reportedById: 'inspector1' };
    AuthorizationPolicies.nonConformance.update().authorize(
      createAuthContext(inspector, 'update', nc)
    );
    console.log('✓ Inspector closes their own NC');
  }

  /**
   * Scenario: Document lifecycle
   */
  static async documentLifecycle() {
    const author: JWTPayload = {
      userId: 'author1',
      email: 'author@company.com',
      role: 'USER',
    };

    // Step 1: Author tries to create document (should fail)
    console.log('1. USER tries to create document (should fail)');
    try {
      AuthorizationPolicies.document.create().authorize(
        createAuthContext(author, 'create')
      );
      console.log('✗ Should not allow USER to create documents');
    } catch (error) {
      console.log('✓ Correctly denied - only ADMIN/MANAGER can create');
    }

    // Step 2: Manager creates document
    const manager: JWTPayload = {
      userId: 'manager1',
      email: 'manager@company.com',
      role: 'MANAGER',
    };

    console.log('2. MANAGER creates document');
    AuthorizationPolicies.document.create().authorize(
      createAuthContext(manager, 'create')
    );

    // Step 3: Manager updates their document
    console.log('3. MANAGER updates their document');
    const doc = { createdById: 'manager1' };
    AuthorizationPolicies.document.update().authorize(
      createAuthContext(manager, 'update', doc)
    );
    console.log('✓ Manager updates document');
  }
}

// ============================================================================
// Usage Instructions
// ============================================================================

/*
To use these examples:

1. Import authorization utilities:
   import { requireAuthentication, AuthorizationPolicies, createAuthContext } from '@/shared/utils';

2. In your service methods:
   - Authenticate the user: requireAuthentication(currentUser)
   - Fetch the resource from database
   - Create authorization context with resource ownership
   - Call authorize() on the appropriate policy

3. For custom rules:
   - Create new AuthorizationRule()
   - Chain authorization methods (.allowAdmin(), .allowCreator(), etc.)
   - Call .authorize(context) or .check(context)

4. For UI permissions:
   - Use .check() instead of .authorize() to avoid throwing
   - Return permission flags to frontend
   - Frontend shows/hides buttons based on permissions

5. Testing:
   - Test each authorization scenario in isolation
   - Test with different user roles (ADMIN, MANAGER, USER)
   - Test resource ownership scenarios
   - Test authorization failures

For complete documentation, see AUTHORIZATION.md
*/

export default {
  ExampleService,
  CorrectiveActionExample,
  CustomAuthExample,
  WorkflowExample,
  PermissionHelper,
  AuthorizationTests,
  RealWorldScenarios,
};

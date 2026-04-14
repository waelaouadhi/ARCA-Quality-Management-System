# Quality Management System Role-Based Access Control

## 1. Role Definitions and Privileges

### ADMIN Role

- **Full system access** with unrestricted privileges
- **User Management**: Create, read, update, delete all users
- **Document Management**: Full CRUD operations on documents (create, read, update, delete, archive)
- **Non-Conformance Management**: Full CRUD operations on non-conformances
- **Corrective Action Management**: Full CRUD operations on corrective actions
- **System Configuration**: Access to all system settings and audit logs
- **Privilege Level**: Highest authority in the QMS

### MANAGER Role

- **Department-level access** focused on quality operations
- **User Management**: Read-only access to user information (cannot create/modify/delete users)
- **Document Management**: Create, read, update documents (cannot delete/archive based on current implementation)
- **Non-Conformance Management**: Create, read, update non-conformances
- **Corrective Action Management**: Create, read, update, assign corrective actions
- **Privilege Level**: Operational authority for quality processes

### USER Role

- **Basic operational access** for day-to-day quality activities
- **User Management**: No access (cannot view or modify other users)
- **Document Management**: Read-only access to approved documents
- **Non-Conformance Management**:
  - Create new non-conformance reports (based on seed data showing users reporting issues)
  - Read access to non-conformance details
  - Limited update capabilities (status changes may be restricted)
- **Corrective Action Management**:
  - Read access to assigned corrective actions
  - Update progress on assigned actions (based on typical workflow)
- **Privilege Level**: Operational user focused on reporting and following procedures

## 2. Real-World Use Case Scenario

### Scenario: Label Non-Conformance Resolution in Pharmaceutical Manufacturing

**Context**: A pharmaceutical company uses the QMS to manage quality processes. During routine packaging line inspection, a user identifies a labeling issue.

#### Step 1: Issue Identification (USER Role)

- **Actor**: Packaging Line Operator (USER role)
- **Action**:
  - Notices that Batch PKG-2026-045 has labels with outdated revision code
  - Logs into QMS and creates a new Non-Conformance report
  - Fills in details:
    - Title: "Label mismatch on batch PKG-2026-045"
    - Description: "Product labels showed outdated revision code on 120 units"
    - Severity: HIGH (potential recall risk)
    - Attaches photos of affected labels
- **System Response**:
  - NC created with status "OPEN"
  - Automatically assigned NC ID: NC-2026-0087
  - Notification sent to Quality Manager

#### Step 2: Initial Review and Assignment (MANAGER Role)

- **Actor**: Quality Manager (MANAGER role)
- **Action**:
  - Receives notification of new HIGH severity NC
  - Reviews NC details in QMS
  - Validates the issue by checking production records
  - Updates NC status to "IN_PROGRESS"
  - Creates Corrective Action:
    - Title: "Revise label release checklist and add final dual-sign review"
    - Description: "Update label verification procedure to require two independent checks before release"
    - Assigns to: Themselves (for procedure update)
    - Due Date: 1 week from creation
  - Notifies Labeling Supervisor about the issue
- **System Response**:
  - CA created with status "PENDING"
  - Linked to NC-2026-0087
  - Audit log entries created for NC status change and CA creation

#### Step 3: Corrective Action Implementation (MANAGER Role)

- **Actor**: Quality Manager (MANAGER role)
- **Action**:
  - Updates label release procedure (SOP-005) to add dual-sign requirement
  - Changes document status from "REVIEW" to "APPROVED" after review
  - Updates Corrective Action:
    - Adds notes about procedure changes
    - Changes status to "IN_PROGRESS" (awaiting training completion)
    - Updates due date if needed
  - Schedules training session for labeling team
- **System Response**:
  - Document version incremented (SOP-005 v3 → v4)
  - Audit log entries for document update and status change
  - CA status updated in system

#### Step 4: Training and Verification (USER and MANAGER Roles)

- **Actor**: Labeling Team Members (USER roles)
- **Action**:
  - Attend training session on new label verification procedure
  - Sign training attendance sheet (scanned into QMS as supporting document)
  - Begin using updated procedure on packaging lines
- **Actor**: Quality Manager (MANAGER role)
- **Action**:
  - Verifies training completion for all labeling staff
  - Updates Corrective Action:
    - Changes status to "DONE"
    - Adds verification notes: "Training completed for 15 labeling technicians"
    - Sets completion date
  - Performs effectiveness check:
    - Reviews next 3 batches produced after implementation
    - Confirms all labels have correct revision codes
    - Updates NC status to "RESOLVED"
- **System Response**:
  - Training records attached to CA
  - Audit log for CA completion
  - NC status updated to "RESOLVED"

#### Step 5: Closure and Review (ADMIN Role)

- **Actor**: QMS Administrator (ADMIN role)
- **Action**:
  - Reviews completed NC and CA for completeness
  - Verifies all required documentation is attached
  - Confirms effectiveness check results are satisfactory
  - Closes the Non-Conformance:
    - Changes status from "RESOLVED" to "CLOSED"
    - Adds final review notes: "Label issue resolved through procedure enhancement and training. No recurrence in 30 days."
  - Generates monthly quality report including this NC
- **System Response**:
  - NC status updated to "CLOSED"
  - Final audit log entry created
  - NC and CA now appear in closed/resolved reports
  - All related documents remain accessible for reference

## 3. Analysis of the Scenario

### Strengths Observed:

1. **Clear Role Separation**: Each role performed actions appropriate to their authority level
2. **Proper Workflow Flow**: Issue → Reporting → Investigation → Action → Verification → Closure
3. **Audit Trail**: Complete traceability from initial report through resolution
4. **Timely Notifications**: System alerts ensured appropriate follow-up
5. **Evidence-Based Closure**: Effectiveness check performed before final closure

### Potential Improvements:

1. **USER Role Enhancement**: Allow users to add comments or updates to NCs they reported (currently may be restricted)
2. **MANAGER Delegation**: Enable managers to delegate NC review to qualified users when overloaded
3. **Automated Escalation**: Implement automatic escalation for overdue NCs/CAs based on severity
4. **Effectiveness Check Standardization**: Create standardized template for effectiveness verification
5. **Trending Analysis**: Add automatic trending reports for similar NC types
6. **Mobile Access**: Improve mobile interface for shop floor users to report issues faster
7. **Training Integration**: Link training records directly to employee profiles in the system

### Risk Mitigation Demonstrated:

- **Prevented Recall**: Early detection and correction prevented distribution of mislabeled product
- **Process Improvement**: Root cause addressed through procedure update rather than just retraining
- **Knowledge Preservation**: Updated SOP captures lesson learned for future reference
- **Regulatory Compliance**: Complete documentation supports audit readiness

## 4. Feedback on Current RBAC Implementation

### What Works Well:

1. **Clear Role Hierarchy**: ADMIN > MANAGER > USER hierarchy is logically implemented
2. **Consistent Authorization Checks**: Services consistently check roles before allowing write operations
3. **Separation of Concerns**: User service handles ADMIN-only operations separately
4. **Error Handling**: Proper AuthorizationError thrown with meaningful messages
5. **Seed Data Alignment**: Predefined roles match the enum definition in Prisma schema

### Areas for Improvement:

1. **Inconsistent Role Validation**:
   - Some services use hardcoded role sets (e.g., `new Set(['ADMIN', 'MANAGER'])`)
   - Others might benefit from centralized role permission definitions
   - Consider creating a RolePermissions service or utility

2. **Limited Granularity**:
   - All write operations grouped together (create/update/delete treated same)
   - Consider distinguishing between create vs update vs delete permissions
   - Example: Users might create NCs but only managers can update severity/status

3. **Missing VIEWER Role**:
   - Validation schemas include 'VIEWER' role but it's not defined in Prisma schema
   - Either implement VIEWER role or remove from validation schemas
   - VIEWER would be useful for auditors or executives needing read-only access

4. **Document-Specific Permissions**:
   - Current implementation doesn't distinguish between document statuses
   - Consider allowing users to create documents in DRAFT status but requiring MANAGER+ for APPROVED
   - Implement document lifecycle-based permissions (DRAFT → REVIEW → APPROVED → ARCHIVED)

5. **Dynamic Role Assignment**:
   - Roles are static; consider context-based permissions
   - Example: User who reported an NC might get temporary update rights on that specific NC
   - Or: User assigned to a CA gets update rights on that specific action

6. **Performance Considerations**:
   - Role checks happen on every service call
   - For high-throughput systems, consider caching user roles/permissions
   - Though current implementation is reasonable for typical QMS usage

7. **Audit Coverage**:
   - While audit logs track actions, consider logging authorization failures
   - Failed authorization attempts could indicate security probing or user confusion

### Recommendations:

1. **Create Centralized Permission Service**:

   ```typescript
   // Example structure
   const ROLE_PERMISSIONS = {
     ADMIN: ['*'], // All permissions
     MANAGER: [
       'document:create',
       'document:read',
       'document:update',
       'nc:create',
       'nc:read',
       'nc:update',
       'ca:create',
       'ca:read',
       'ca:update',
       'ca:assign',
       'user:read',
     ],
     USER: [
       'document:read',
       'nc:create',
       'nc:read', // Own NCs only?
       'ca:read',
       'ca:update:own', // Only assigned CAs?
       'user:read:own',
     ],
   };
   ```

2. **Implement Resource-Based Permissions**:
   - Allow users to update NCs they reported
   - Allow users to update CAs assigned to them
   - Keep administrative functions restricted to appropriate roles

3. **Add Lifecycle-Based Document Permissions**:
   - DRAFT: Creator can update/delete
   - REVIEW: Assigned reviewers can update status/comments
   - APPROVED: Read-only for most, MANAGER+ can update to new version
   - ARCHIVED: Read-only for all, ADMIN can restore

4. **Standardize Error Messages**:
   - Ensure all authorization errors follow consistent format
   - Consider including required role in error message for clarity
   - Example: "Insufficient permissions. Required role: MANAGER or ADMIN"

5. **Consider Role Inheritance**:
   - MANAGER inherits USER permissions plus additional
   - ADMIN inherits MANAGER permissions plus additional
   - Reduces duplication in permission definitions

Overall, the current RBAC implementation provides a solid foundation for securing the QMS. The role-based checks are consistently applied in service layers, and the hierarchy aligns with typical quality management organizational structures. Enhancing granularity and adding context-aware permissions would further improve usability while maintaining security.

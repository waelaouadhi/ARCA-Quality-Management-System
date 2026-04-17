/**
 * Lifecycle-Based Document Service with Status Enforcement
 * 
 * This example shows how to integrate lifecycle authorization
 * into your document service layer.
 */

import { NotFoundError, ValidationError, AuthorizationError } from '@/shared/errors';
import { JWTPayload } from '@/shared/utils/jwt';
import {
  DocumentStatus,
  DocumentAction,
  DocumentData,
  authorizeLifecycleAction,
  canPerformLifecycleAction,
  validateStatusChange,
  validateVersionCreation,
  getNextVersion,
  isDocumentEditable,
  getAllowedActions,
  StatusTransitionRules,
} from '@/shared/utils/lifecycleAuthorization';

// ============================================================================
// Enhanced Document Service with Lifecycle Authorization
// ============================================================================

interface CreateDocumentInput {
  title: string;
  content: string;
  reviewerIds?: string[];
}

interface UpdateDocumentInput {
  title?: string;
  content?: string;
}

interface ReviewInput {
  comment: string;
  approved: boolean;
}

export class LifecycleDocumentService {
  
  // ==========================================================================
  // DRAFT Status Operations
  // ==========================================================================
  
  /**
   * Create new document (starts in DRAFT)
   */
  async createDocument(user: JWTPayload, input: CreateDocumentInput) {
    // Create document in DRAFT status
    const document = {
      id: 'doc-1',
      title: input.title,
      content: input.content,
      status: 'DRAFT' as DocumentStatus,
      createdById: user.userId,
      reviewerIds: input.reviewerIds || [],
      version: 1,
      previousVersionId: null,
      approvedById: null,
      approvedAt: null,
    };
    
    console.log(`✅ Document created in DRAFT status by ${user.email}`);
    
    return document;
  }
  
  /**
   * Update DRAFT document
   */
  async updateDraftDocument(
    user: JWTPayload,
    documentId: string,
    input: UpdateDocumentInput
  ) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.EDIT,
    });
    
    // Update document
    const updated = {
      ...document,
      ...input,
    };
    
    console.log(`✅ DRAFT document updated by ${user.email}`);
    
    return updated;
  }
  
  /**
   * Delete DRAFT document
   */
  async deleteDraftDocument(user: JWTPayload, documentId: string) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.DELETE,
    });
    
    console.log(`✅ DRAFT document deleted by ${user.email}`);
    
    return true;
  }
  
  /**
   * Submit DRAFT for review
   */
  async submitForReview(user: JWTPayload, documentId: string, reviewerIds: string[]) {
    const document = await this.getDocumentData(documentId);
    
    // Check if can submit for review
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.SUBMIT_FOR_REVIEW,
    });
    
    // Validate reviewers are assigned
    if (!reviewerIds || reviewerIds.length === 0) {
      throw new ValidationError('At least one reviewer must be assigned');
    }
    
    // Validate status transition
    validateStatusChange(user, document, 'REVIEW');
    
    const updated = {
      ...document,
      status: 'REVIEW' as DocumentStatus,
      reviewerIds,
      submittedAt: new Date(),
    };
    
    console.log(`✅ Document submitted for review by ${user.email}`);
    console.log(`   Reviewers: ${reviewerIds.join(', ')}`);
    
    return updated;
  }
  
  // ==========================================================================
  // REVIEW Status Operations
  // ==========================================================================
  
  /**
   * Add review comment
   */
  async addReviewComment(
    user: JWTPayload,
    documentId: string,
    comment: string
  ) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.ADD_COMMENT,
    });
    
    console.log(`✅ Review comment added by ${user.email}`);
    console.log(`   Comment: "${comment}"`);
    
    return { documentId, comment, userId: user.userId, createdAt: new Date() };
  }
  
  /**
   * Update document during review (reviewers only)
   */
  async updateDuringReview(
    user: JWTPayload,
    documentId: string,
    input: UpdateDocumentInput
  ) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization (only reviewers can edit)
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.EDIT,
    });
    
    const updated = {
      ...document,
      ...input,
    };
    
    console.log(`✅ Document updated during review by reviewer ${user.email}`);
    
    return updated;
  }
  
  /**
   * Approve document
   */
  async approveDocument(user: JWTPayload, documentId: string) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization (MANAGER+ only)
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.APPROVE,
    });
    
    // Validate status transition
    validateStatusChange(user, document, 'APPROVED');
    
    const updated = {
      ...document,
      status: 'APPROVED' as DocumentStatus,
      approvedById: user.userId,
      approvedAt: new Date(),
    };
    
    console.log(`✅ Document APPROVED by ${user.email}`);
    
    return updated;
  }
  
  /**
   * Reject document (send back to DRAFT)
   */
  async rejectDocument(
    user: JWTPayload,
    documentId: string,
    rejectionReason: string
  ) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.REJECT,
    });
    
    // Validate status transition
    validateStatusChange(user, document, 'DRAFT');
    
    const updated = {
      ...document,
      status: 'DRAFT' as DocumentStatus,
      rejectedById: user.userId,
      rejectedAt: new Date(),
      rejectionReason,
    };
    
    console.log(`✅ Document REJECTED by ${user.email}`);
    console.log(`   Reason: "${rejectionReason}"`);
    
    return updated;
  }
  
  // ==========================================================================
  // APPROVED Status Operations
  // ==========================================================================
  
  /**
   * View approved document (all users)
   */
  async viewApprovedDocument(user: JWTPayload, documentId: string) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization (read-only)
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.VIEW,
    });
    
    console.log(`✅ APPROVED document viewed by ${user.email}`);
    
    return document;
  }
  
  /**
   * Create new version of approved document
   * 
   * ISO Compliance: Revision control
   */
  async createNewVersion(
    user: JWTPayload,
    documentId: string,
    changes: UpdateDocumentInput
  ) {
    const currentDocument = await this.getDocumentData(documentId);
    
    // Validate version creation (MANAGER+ only, APPROVED status only)
    validateVersionCreation(user, currentDocument);
    
    // Create new DRAFT version
    const newVersion = {
      id: `${documentId}-v${getNextVersion(currentDocument.version)}`,
      title: changes.title || currentDocument.title,
      content: changes.content || currentDocument.content,
      status: 'DRAFT' as DocumentStatus,
      createdById: user.userId,
      version: getNextVersion(currentDocument.version),
      previousVersionId: documentId,
      reviewerIds: [],
      approvedById: null,
      approvedAt: null,
    };
    
    console.log(`✅ New version (v${newVersion.version}) created by ${user.email}`);
    console.log(`   Previous version: ${documentId} (v${currentDocument.version})`);
    
    return newVersion;
  }
  
  /**
   * Attempt to edit approved document (should fail)
   */
  async updateApprovedDocument(
    user: JWTPayload,
    documentId: string,
    input: UpdateDocumentInput
  ) {
    const document = await this.getDocumentData(documentId);
    
    // This will throw AuthorizationError
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.EDIT,
    });
    
    // Never reached
    return document;
  }
  
  /**
   * Archive approved document
   */
  async archiveDocument(user: JWTPayload, documentId: string) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization (MANAGER+ only)
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.ARCHIVE,
    });
    
    // Validate status transition
    validateStatusChange(user, document, 'ARCHIVED');
    
    const updated = {
      ...document,
      status: 'ARCHIVED' as DocumentStatus,
      archivedById: user.userId,
      archivedAt: new Date(),
    };
    
    console.log(`✅ Document ARCHIVED by ${user.email}`);
    
    return updated;
  }
  
  // ==========================================================================
  // ARCHIVED Status Operations
  // ==========================================================================
  
  /**
   * View archived document (all users, read-only)
   */
  async viewArchivedDocument(user: JWTPayload, documentId: string) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization (read-only)
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.VIEW,
    });
    
    console.log(`✅ ARCHIVED document viewed by ${user.email}`);
    
    return document;
  }
  
  /**
   * Restore archived document (ADMIN only)
   */
  async restoreDocument(user: JWTPayload, documentId: string) {
    const document = await this.getDocumentData(documentId);
    
    // Enforce lifecycle authorization (ADMIN only)
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.RESTORE,
    });
    
    // Validate status transition
    validateStatusChange(user, document, 'APPROVED');
    
    const updated = {
      ...document,
      status: 'APPROVED' as DocumentStatus,
      restoredById: user.userId,
      restoredAt: new Date(),
    };
    
    console.log(`✅ Document RESTORED by ${user.email}`);
    
    return updated;
  }
  
  /**
   * Attempt to edit archived document (should fail)
   */
  async updateArchivedDocument(
    user: JWTPayload,
    documentId: string,
    input: UpdateDocumentInput
  ) {
    const document = await this.getDocumentData(documentId);
    
    // This will throw AuthorizationError
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.EDIT,
    });
    
    // Never reached
    return document;
  }
  
  // ==========================================================================
  // General Operations (Status-Aware)
  // ==========================================================================
  
  /**
   * Get document with permission check
   */
  async getDocument(user: JWTPayload, documentId: string) {
    const document = await this.getDocumentData(documentId);
    
    // Check if user can view this document
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.VIEW,
    });
    
    // Return document with allowed actions
    const allowedActions = getAllowedActions(user, document);
    
    return {
      ...document,
      allowedActions,
      isEditable: isDocumentEditable(user, document),
    };
  }
  
  /**
   * Get all available status transitions for document
   */
  async getAvailableTransitions(user: JWTPayload, documentId: string) {
    const document = await this.getDocumentData(documentId);
    
    const allTransitions = StatusTransitionRules.getValidTransitions(document);
    
    // Filter by user permission
    const allowedTransitions = allTransitions.filter(targetStatus =>
      StatusTransitionRules.canTransition(user, document, targetStatus)
    );
    
    return {
      currentStatus: document.status,
      availableTransitions: allowedTransitions,
    };
  }
  
  /**
   * Generic update with lifecycle enforcement
   */
  async updateDocument(
    user: JWTPayload,
    documentId: string,
    input: UpdateDocumentInput
  ) {
    const document = await this.getDocumentData(documentId);
    
    // Check if document is editable in current status
    if (!isDocumentEditable(user, document)) {
      throw new AuthorizationError(
        `Cannot edit document in ${document.status} status. ` +
        (document.status === 'APPROVED'
          ? 'Create a new version instead.'
          : 'Document is read-only.')
      );
    }
    
    // Enforce lifecycle authorization
    authorizeLifecycleAction({
      user,
      document,
      action: DocumentAction.EDIT,
    });
    
    const updated = {
      ...document,
      ...input,
      updatedAt: new Date(),
      updatedById: user.userId,
    };
    
    console.log(`✅ Document updated by ${user.email} (Status: ${document.status})`);
    
    return updated;
  }
  
  // ==========================================================================
  // Helper Methods
  // ==========================================================================
  
  private async getDocumentData(documentId: string): Promise<DocumentData> {
    // Mock document retrieval
    // In real implementation, this would query the database
    return {
      id: documentId,
      title: 'Sample Document',
      content: 'Document content...',
      status: 'DRAFT',
      createdById: 'user-1',
      reviewerIds: ['reviewer-1', 'reviewer-2'],
      version: 1,
      previousVersionId: null,
      approvedById: null,
      approvedAt: null,
    };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

export async function demonstrateLifecycleWorkflow() {
  const service = new LifecycleDocumentService();
  
  // Users
  const creator: JWTPayload = {
    userId: 'user-1',
    email: 'creator@example.com',
    role: 'USER',
  };
  
  const reviewer: JWTPayload = {
    userId: 'reviewer-1',
    email: 'reviewer@example.com',
    role: 'USER',
  };
  
  const manager: JWTPayload = {
    userId: 'manager-1',
    email: 'manager@example.com',
    role: 'MANAGER',
  };
  
  const admin: JWTPayload = {
    userId: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN',
  };
  
  console.log('\n=== Document Lifecycle Workflow Demo ===\n');
  
  // 1. Create document (DRAFT)
  console.log('1️⃣ Creating document...');
  const doc = await service.createDocument(creator, {
    title: 'Quality Procedure QP-001',
    content: 'This is a quality procedure document...',
  });
  
  // 2. Update draft
  console.log('\n2️⃣ Updating DRAFT document...');
  await service.updateDraftDocument(creator, doc.id, {
    content: 'Updated content...',
  });
  
  // 3. Submit for review
  console.log('\n3️⃣ Submitting for review...');
  await service.submitForReview(creator, doc.id, ['reviewer-1']);
  
  // 4. Reviewer adds comment
  console.log('\n4️⃣ Reviewer adding comment...');
  await service.addReviewComment(reviewer, doc.id, 'Please clarify section 2.1');
  
  // 5. Manager approves
  console.log('\n5️⃣ Manager approving document...');
  await service.approveDocument(manager, doc.id);
  
  // 6. Try to edit approved document (FAILS)
  console.log('\n6️⃣ Attempting to edit APPROVED document...');
  try {
    await service.updateApprovedDocument(manager, doc.id, {
      content: 'New content',
    });
  } catch (error) {
    console.log(`   ❌ ${(error as Error).message}`);
  }
  
  // 7. Create new version
  console.log('\n7️⃣ Creating new version...');
  await service.createNewVersion(manager, doc.id, {
    content: 'Revised content for v2...',
  });
  
  // 8. Archive original
  console.log('\n8️⃣ Archiving original version...');
  await service.archiveDocument(manager, doc.id);
  
  // 9. Try to edit archived (FAILS)
  console.log('\n9️⃣ Attempting to edit ARCHIVED document...');
  try {
    await service.updateArchivedDocument(admin, doc.id, {
      content: 'New content',
    });
  } catch (error) {
    console.log(`   ❌ ${(error as Error).message}`);
  }
  
  // 10. Admin restores
  console.log('\n🔟 Admin restoring document...');
  await service.restoreDocument(admin, doc.id);
  
  console.log('\n=== Workflow Complete ===\n');
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateLifecycleWorkflow();
}

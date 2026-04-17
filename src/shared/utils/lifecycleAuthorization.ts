import { AuthorizationError } from '@/shared/errors';
import { JWTPayload } from './jwt';
import type { Role } from './permissions';

/**
 * Lifecycle-Based Access Control System
 * 
 * Implements status-based authorization for document workflows.
 * Compliant with ISO/GMP requirements for controlled documents.
 * 
 * Document Lifecycle:
 * DRAFT → REVIEW → APPROVED → ARCHIVED
 * 
 * Rules enforce different permissions based on document state.
 */

// ============================================================================
// Types & Constants
// ============================================================================

export type DocumentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED';

/**
 * Actions that can be performed on documents
 */
export enum DocumentAction {
  // Read actions
  VIEW = 'view',
  DOWNLOAD = 'download',
  
  // Write actions
  EDIT = 'edit',
  UPDATE_CONTENT = 'updateContent',
  UPDATE_METADATA = 'updateMetadata',
  DELETE = 'delete',
  
  // Workflow actions
  SUBMIT_FOR_REVIEW = 'submitForReview',
  ADD_COMMENT = 'addComment',
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  
  // Versioning actions
  CREATE_NEW_VERSION = 'createNewVersion',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  
  // Administrative
  CHANGE_STATUS = 'changeStatus',
  ASSIGN_REVIEWER = 'assignReviewer',
}

/**
 * Document data for authorization checks
 */
export interface DocumentData {
  id: string;
  status: DocumentStatus;
  createdById: string;
  reviewerIds?: string[];
  version?: number;
  previousVersionId?: string | null;
  approvedById?: string | null;
  approvedAt?: Date | null;
}

/**
 * Authorization context for lifecycle checks
 */
export interface LifecycleAuthContext {
  user: JWTPayload;
  document: DocumentData;
  action: DocumentAction;
}

// ============================================================================
// Lifecycle Authorization Rules
// ============================================================================

/**
 * DRAFT Status Rules
 * 
 * ISO Compliance: Documents in draft are unrestricted work-in-progress
 * 
 * Allowed:
 * - Creator: Full edit/delete access
 * - ADMIN: Full access
 * - Others: No access unless granted
 */
export class DraftRules {
  static canView(user: JWTPayload, document: DocumentData): boolean {
    // Creator and ADMIN can view
    return this.isCreator(user, document) || this.isAdmin(user);
  }
  
  static canEdit(user: JWTPayload, document: DocumentData): boolean {
    // Only creator and ADMIN can edit
    return this.isCreator(user, document) || this.isAdmin(user);
  }
  
  static canDelete(user: JWTPayload, document: DocumentData): boolean {
    // Only creator and ADMIN can delete
    return this.isCreator(user, document) || this.isAdmin(user);
  }
  
  static canSubmitForReview(user: JWTPayload, document: DocumentData): boolean {
    // Creator can submit, ADMIN can force submit
    return this.isCreator(user, document) || this.isAdmin(user);
  }
  
  private static isCreator(user: JWTPayload, document: DocumentData): boolean {
    return user.userId === document.createdById;
  }
  
  private static isAdmin(user: JWTPayload): boolean {
    return user.role === 'ADMIN';
  }
}

/**
 * REVIEW Status Rules
 * 
 * ISO Compliance: Documents under review are controlled
 * 
 * Allowed:
 * - Reviewers: Comment, approve/reject, minor edits
 * - MANAGER+: Full review capabilities
 * - Creator: View only (can't edit during review)
 * - ADMIN: Full access
 */
export class ReviewRules {
  static canView(user: JWTPayload, document: DocumentData): boolean {
    // Reviewers, creator, manager, admin can view
    return (
      this.isReviewer(user, document) ||
      this.isCreator(user, document) ||
      this.isManagerOrAbove(user)
    );
  }
  
  static canEdit(user: JWTPayload, document: DocumentData): boolean {
    // Only assigned reviewers and ADMIN can make edits during review
    return this.isReviewer(user, document) || this.isAdmin(user);
  }
  
  static canComment(user: JWTPayload, document: DocumentData): boolean {
    // Reviewers and managers can comment
    return this.isReviewer(user, document) || this.isManagerOrAbove(user);
  }
  
  static canApprove(user: JWTPayload, document: DocumentData): boolean {
    // Only MANAGER and ADMIN can approve
    return this.isManagerOrAbove(user);
  }
  
  static canReject(user: JWTPayload, document: DocumentData): boolean {
    // Reviewers and managers can reject
    return this.isReviewer(user, document) || this.isManagerOrAbove(user);
  }
  
  static canDelete(user: JWTPayload, document: DocumentData): boolean {
    // Only ADMIN can delete during review
    return this.isAdmin(user);
  }
  
  private static isReviewer(user: JWTPayload, document: DocumentData): boolean {
    return document.reviewerIds?.includes(user.userId) ?? false;
  }
  
  private static isCreator(user: JWTPayload, document: DocumentData): boolean {
    return user.userId === document.createdById;
  }
  
  private static isManagerOrAbove(user: JWTPayload): boolean {
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  }
  
  private static isAdmin(user: JWTPayload): boolean {
    return user.role === 'ADMIN';
  }
}

/**
 * APPROVED Status Rules
 * 
 * ISO Compliance: Approved documents are controlled and read-only
 * 
 * Allowed:
 * - All: Read access
 * - MANAGER+: Create new version (revision control)
 * - No direct edits allowed (must create new version)
 * - ADMIN: Archive capability
 */
export class ApprovedRules {
  static canView(user: JWTPayload, document: DocumentData): boolean {
    // All authenticated users can view approved documents
    return true;
  }
  
  static canDownload(user: JWTPayload, document: DocumentData): boolean {
    // All authenticated users can download approved documents
    return true;
  }
  
  static canEdit(user: JWTPayload, document: DocumentData): boolean {
    // No direct edits allowed on approved documents
    // Must create new version instead
    return false;
  }
  
  static canDelete(user: JWTPayload, document: DocumentData): boolean {
    // Only ADMIN can delete approved documents
    return this.isAdmin(user);
  }
  
  static canCreateNewVersion(user: JWTPayload, document: DocumentData): boolean {
    // MANAGER and ADMIN can create new versions
    return this.isManagerOrAbove(user);
  }
  
  static canArchive(user: JWTPayload, document: DocumentData): boolean {
    // MANAGER and ADMIN can archive
    return this.isManagerOrAbove(user);
  }
  
  private static isManagerOrAbove(user: JWTPayload): boolean {
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  }
  
  private static isAdmin(user: JWTPayload): boolean {
    return user.role === 'ADMIN';
  }
}

/**
 * ARCHIVED Status Rules
 * 
 * ISO Compliance: Archived documents are retained for compliance
 * 
 * Allowed:
 * - All: Read-only access (audit trail)
 * - ADMIN: Restore capability
 * - No edits or deletions (preservation requirement)
 */
export class ArchivedRules {
  static canView(user: JWTPayload, document: DocumentData): boolean {
    // All authenticated users can view archived documents
    return true;
  }
  
  static canDownload(user: JWTPayload, document: DocumentData): boolean {
    // All authenticated users can download for reference
    return true;
  }
  
  static canEdit(user: JWTPayload, document: DocumentData): boolean {
    // No edits allowed on archived documents
    return false;
  }
  
  static canDelete(user: JWTPayload, document: DocumentData): boolean {
    // Only ADMIN can delete (with audit log)
    return this.isAdmin(user);
  }
  
  static canRestore(user: JWTPayload, document: DocumentData): boolean {
    // Only ADMIN can restore
    return this.isAdmin(user);
  }
  
  private static isAdmin(user: JWTPayload): boolean {
    return user.role === 'ADMIN';
  }
}

// ============================================================================
// Lifecycle Status Transition Rules
// ============================================================================

/**
 * Controls valid status transitions
 * 
 * ISO Compliance: Enforces controlled workflow
 */
export class StatusTransitionRules {
  private static readonly VALID_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
    DRAFT: ['REVIEW'],
    REVIEW: ['DRAFT', 'APPROVED'], // Can reject back to DRAFT or approve
    APPROVED: ['ARCHIVED'],
    ARCHIVED: ['APPROVED'], // Can restore (ADMIN only)
  };
  
  static isValidTransition(from: DocumentStatus, to: DocumentStatus): boolean {
    const validTargets = this.VALID_TRANSITIONS[from] || [];
    return validTargets.includes(to);
  }
  
  static canTransition(
    user: JWTPayload,
    document: DocumentData,
    targetStatus: DocumentStatus
  ): boolean {
    // Check if transition is valid
    if (!this.isValidTransition(document.status, targetStatus)) {
      return false;
    }
    
    // Check role-based permissions for each transition
    switch (`${document.status}->${targetStatus}`) {
      case 'DRAFT->REVIEW':
        // Creator or ADMIN can submit for review
        return document.createdById === user.userId || user.role === 'ADMIN';
        
      case 'REVIEW->DRAFT':
        // Reject: Reviewers, MANAGER, ADMIN
        return ReviewRules.canReject(user, document);
        
      case 'REVIEW->APPROVED':
        // Approve: MANAGER, ADMIN only
        return ReviewRules.canApprove(user, document);
        
      case 'APPROVED->ARCHIVED':
        // Archive: MANAGER, ADMIN
        return ApprovedRules.canArchive(user, document);
        
      case 'ARCHIVED->APPROVED':
        // Restore: ADMIN only
        return ArchivedRules.canRestore(user, document);
        
      default:
        return false;
    }
  }
  
  static getValidTransitions(document: DocumentData): DocumentStatus[] {
    return this.VALID_TRANSITIONS[document.status] || [];
  }
}

// ============================================================================
// Main Lifecycle Authorization Function
// ============================================================================

/**
 * Authorize an action based on document lifecycle status
 * 
 * @param context - Authorization context
 * @returns true if authorized
 * @throws AuthorizationError if not authorized
 */
export function authorizeLifecycleAction(context: LifecycleAuthContext): boolean {
  const { user, document, action } = context;
  
  let allowed = false;
  
  switch (document.status) {
    case 'DRAFT':
      allowed = authorizeDraftAction(user, document, action);
      break;
      
    case 'REVIEW':
      allowed = authorizeReviewAction(user, document, action);
      break;
      
    case 'APPROVED':
      allowed = authorizeApprovedAction(user, document, action);
      break;
      
    case 'ARCHIVED':
      allowed = authorizeArchivedAction(user, document, action);
      break;
      
    default:
      throw new AuthorizationError(`Invalid document status: ${document.status}`);
  }
  
  if (!allowed) {
    throw new AuthorizationError(
      `Action '${action}' not allowed on ${document.status} document`
    );
  }
  
  return true;
}

/**
 * Check if action is allowed without throwing error
 */
export function canPerformLifecycleAction(context: LifecycleAuthContext): boolean {
  try {
    authorizeLifecycleAction(context);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Action Authorization by Status
// ============================================================================

function authorizeDraftAction(
  user: JWTPayload,
  document: DocumentData,
  action: DocumentAction
): boolean {
  switch (action) {
    case DocumentAction.VIEW:
    case DocumentAction.DOWNLOAD:
      return DraftRules.canView(user, document);
      
    case DocumentAction.EDIT:
    case DocumentAction.UPDATE_CONTENT:
    case DocumentAction.UPDATE_METADATA:
      return DraftRules.canEdit(user, document);
      
    case DocumentAction.DELETE:
      return DraftRules.canDelete(user, document);
      
    case DocumentAction.SUBMIT_FOR_REVIEW:
      return DraftRules.canSubmitForReview(user, document);
      
    case DocumentAction.CHANGE_STATUS:
      return user.role === 'ADMIN';
      
    default:
      return false;
  }
}

function authorizeReviewAction(
  user: JWTPayload,
  document: DocumentData,
  action: DocumentAction
): boolean {
  switch (action) {
    case DocumentAction.VIEW:
    case DocumentAction.DOWNLOAD:
      return ReviewRules.canView(user, document);
      
    case DocumentAction.EDIT:
    case DocumentAction.UPDATE_CONTENT:
    case DocumentAction.UPDATE_METADATA:
      return ReviewRules.canEdit(user, document);
      
    case DocumentAction.ADD_COMMENT:
    case DocumentAction.REVIEW:
      return ReviewRules.canComment(user, document);
      
    case DocumentAction.APPROVE:
      return ReviewRules.canApprove(user, document);
      
    case DocumentAction.REJECT:
      return ReviewRules.canReject(user, document);
      
    case DocumentAction.DELETE:
      return ReviewRules.canDelete(user, document);
      
    case DocumentAction.ASSIGN_REVIEWER:
      return user.role === 'ADMIN' || user.role === 'MANAGER';
      
    default:
      return false;
  }
}

function authorizeApprovedAction(
  user: JWTPayload,
  document: DocumentData,
  action: DocumentAction
): boolean {
  switch (action) {
    case DocumentAction.VIEW:
    case DocumentAction.DOWNLOAD:
      return ApprovedRules.canView(user, document);
      
    case DocumentAction.EDIT:
    case DocumentAction.UPDATE_CONTENT:
    case DocumentAction.UPDATE_METADATA:
      return ApprovedRules.canEdit(user, document);
      
    case DocumentAction.DELETE:
      return ApprovedRules.canDelete(user, document);
      
    case DocumentAction.CREATE_NEW_VERSION:
      return ApprovedRules.canCreateNewVersion(user, document);
      
    case DocumentAction.ARCHIVE:
      return ApprovedRules.canArchive(user, document);
      
    default:
      return false;
  }
}

function authorizeArchivedAction(
  user: JWTPayload,
  document: DocumentData,
  action: DocumentAction
): boolean {
  switch (action) {
    case DocumentAction.VIEW:
    case DocumentAction.DOWNLOAD:
      return ArchivedRules.canView(user, document);
      
    case DocumentAction.EDIT:
    case DocumentAction.UPDATE_CONTENT:
      return ArchivedRules.canEdit(user, document);
      
    case DocumentAction.DELETE:
      return ArchivedRules.canDelete(user, document);
      
    case DocumentAction.RESTORE:
      return ArchivedRules.canRestore(user, document);
      
    default:
      return false;
  }
}

// ============================================================================
// Versioning Helpers
// ============================================================================

/**
 * Create new version of approved document
 * 
 * ISO Compliance: Revision control for controlled documents
 */
export function canCreateNewVersion(user: JWTPayload, document: DocumentData): boolean {
  if (document.status !== 'APPROVED') {
    return false;
  }
  
  return ApprovedRules.canCreateNewVersion(user, document);
}

/**
 * Get next version number
 */
export function getNextVersion(currentVersion: number): number {
  return currentVersion + 1;
}

/**
 * Validate version creation
 */
export function validateVersionCreation(
  user: JWTPayload,
  document: DocumentData
): void {
  if (document.status !== 'APPROVED') {
    throw new AuthorizationError(
      'Can only create new versions of APPROVED documents'
    );
  }
  
  if (!canCreateNewVersion(user, document)) {
    throw new AuthorizationError(
      'You do not have permission to create new versions'
    );
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get allowed actions for user on document
 */
export function getAllowedActions(
  user: JWTPayload,
  document: DocumentData
): DocumentAction[] {
  const allActions = Object.values(DocumentAction);
  
  return allActions.filter(action => {
    try {
      return canPerformLifecycleAction({ user, document, action });
    } catch {
      return false;
    }
  });
}

/**
 * Check if document is editable
 */
export function isDocumentEditable(
  user: JWTPayload,
  document: DocumentData
): boolean {
  return canPerformLifecycleAction({
    user,
    document,
    action: DocumentAction.EDIT,
  });
}

/**
 * Check if document is read-only
 */
export function isDocumentReadOnly(document: DocumentData): boolean {
  return document.status === 'APPROVED' || document.status === 'ARCHIVED';
}

/**
 * Validate status change
 */
export function validateStatusChange(
  user: JWTPayload,
  document: DocumentData,
  newStatus: DocumentStatus
): void {
  if (!StatusTransitionRules.isValidTransition(document.status, newStatus)) {
    throw new AuthorizationError(
      `Invalid status transition: ${document.status} -> ${newStatus}`
    );
  }
  
  if (!StatusTransitionRules.canTransition(user, document, newStatus)) {
    throw new AuthorizationError(
      `You do not have permission to change status to ${newStatus}`
    );
  }
}

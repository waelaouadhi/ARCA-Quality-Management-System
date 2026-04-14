import { NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload, requireAuthentication, AuthorizationPolicies, createAuthContext } from '@/shared/utils';
import { CorrectiveActionRepository } from './correctiveAction.repository';
import { z } from 'zod';
import {
  CreateCorrectiveActionInputSchema,
  UpdateCorrectiveActionInputSchema,
  CorrectiveActionIdSchema,
} from './correctiveAction.validation';

type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PLANNED';

interface CreateCorrectiveActionInput {
  action: string;
  nonConformanceId: string;
  assignedToId?: string;
  dueDate?: string;
  rootCauseAnalysis?: string;
  requestStatus?: RequestStatus;
}

interface UpdateCorrectiveActionInput {
  action?: string;
  assignedToId?: string;
  dueDate?: string;
  status?: ActionStatus;
  rootCauseAnalysis?: string | null;
  requestStatus?: RequestStatus;
  verificationNotes?: string | null;
}

export class CorrectiveActionService {
  constructor(private readonly correctiveActionRepository = new CorrectiveActionRepository()) {}

  /**
   * Generate a unique CAPA number (e.g., CAPA-2024-001)
   */
  private async generateCapaNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.correctiveActionRepository.countByYear(year);
    const sequenceNumber = (count + 1).toString().padStart(3, '0');
    return `CAPA-${year}-${sequenceNumber}`;
  }

  async createCorrectiveAction(input: CreateCorrectiveActionInput, currentUser?: JWTPayload) {
    try {
      CreateCorrectiveActionInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    
    // Check authorization
    AuthorizationPolicies.correctiveAction.create().authorize(createAuthContext(user, 'create'));

    // Generate unique CAPA number
    const capaNumber = await this.generateCapaNumber();

    return this.correctiveActionRepository.createCorrectiveAction({
      ...input,
      capaNumber,
      requestStatus: input.requestStatus || 'PENDING',
    });
  }

  async getCorrectiveActions(
    paginationInput: PaginationInput = {},
    filters: { status?: ActionStatus; nonConformanceId?: string; assignedToId?: string; requestStatus?: RequestStatus } = {},
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);
    
    // Check authorization
    AuthorizationPolicies.correctiveAction.read().authorize(createAuthContext(user, 'read'));

    return this.correctiveActionRepository.getCorrectiveActions(paginationInput, filters);
  }

  async getCorrectiveActionById(id: string, currentUser?: JWTPayload) {
    try {
      CorrectiveActionIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const action = await this.correctiveActionRepository.getCorrectiveActionById(id);

    if (!action) {
      throw new NotFoundError('Corrective action not found');
    }

    // Check authorization
    AuthorizationPolicies.correctiveAction.read().authorize(
      createAuthContext(user, 'read', { assignedToId: action.assignedToId })
    );

    return action;
  }

  async updateCorrectiveAction(id: string, input: UpdateCorrectiveActionInput, currentUser?: JWTPayload) {
    try {
      CorrectiveActionIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    try {
      UpdateCorrectiveActionInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const action = await this.correctiveActionRepository.getCorrectiveActionById(id);

    if (!action) {
      throw new NotFoundError('Corrective action not found');
    }

    // Resource-based authorization: ADMIN/MANAGER or assigned user can update
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(user, 'update', { assignedToId: action.assignedToId })
    );

    return this.correctiveActionRepository.updateCorrectiveAction(id, input);
  }

  /**
   * Submit RCA (Root Cause Analysis) for approval.
   * Transitions requestStatus from PENDING to PLANNED.
   * rootCauseAnalysis is required.
   */
  async submitRootCauseAnalysis(id: string, rootCauseAnalysis: string, currentUser?: JWTPayload) {
    try {
      CorrectiveActionIdSchema.parse(id);
      z.string().min(10).max(5000).parse(rootCauseAnalysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const action = await this.correctiveActionRepository.getCorrectiveActionById(id);

    if (!action) {
      throw new NotFoundError('Corrective action not found');
    }

    // Only PENDING request status can submit RCA
    if (action.requestStatus !== 'PENDING') {
      throw new ValidationError(
        `Cannot submit RCA for CAPA in ${action.requestStatus} state. Expected PENDING.`
      );
    }

    // Authorization check
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(user, 'update', { assignedToId: action.assignedToId })
    );

    return this.correctiveActionRepository.updateCorrectiveAction(id, {
      rootCauseAnalysis,
      requestStatus: 'PLANNED',
      rootCauseAnalyzedAt: new Date().toISOString(),
      rootCauseAnalyzedBy: user.userId,
    });
  }

  /**
   * Accept a CAPA request for implementation.
   * Transitions requestStatus from PENDING/PLANNED to ACCEPTED.
   * Typically done by a manager/QA team.
   */
  async acceptRequest(id: string, currentUser?: JWTPayload) {
    try {
      CorrectiveActionIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const action = await this.correctiveActionRepository.getCorrectiveActionById(id);

    if (!action) {
      throw new NotFoundError('Corrective action not found');
    }

    if (action.requestStatus !== 'PENDING' && action.requestStatus !== 'PLANNED') {
      throw new ValidationError(
        `Cannot accept CAPA in ${action.requestStatus} state. Expected PENDING or PLANNED.`
      );
    }

    // Only managers/QA can accept requests
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(user, 'update', {})
    );

    return this.correctiveActionRepository.updateCorrectiveAction(id, {
      requestStatus: 'ACCEPTED',
    });
  }

  /**
   * Reject a CAPA request.
   * Transitions requestStatus to REJECTED.
   */
  async rejectRequest(id: string, reason: string, currentUser?: JWTPayload) {
    try {
      CorrectiveActionIdSchema.parse(id);
      z.string().min(5).max(1000).parse(reason);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const action = await this.correctiveActionRepository.getCorrectiveActionById(id);

    if (!action) {
      throw new NotFoundError('Corrective action not found');
    }

    if (action.requestStatus !== 'PENDING' && action.requestStatus !== 'PLANNED') {
      throw new ValidationError(
        `Cannot reject CAPA in ${action.requestStatus} state. Expected PENDING or PLANNED.`
      );
    }

    // Only managers/QA can reject
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(user, 'update', {})
    );

    return this.correctiveActionRepository.updateCorrectiveAction(id, {
      requestStatus: 'REJECTED',
    });
  }

  /**
   * Complete the corrective action implementation.
   * Transitions status from PENDING/IN_PROGRESS to DONE.
   * Requires rootCauseAnalysis to be set (submitted earlier).
   */
  async completeCorrectiveAction(id: string, currentUser?: JWTPayload) {
    try {
      CorrectiveActionIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const action = await this.correctiveActionRepository.getCorrectiveActionById(id);

    if (!action) {
      throw new NotFoundError('Corrective action not found');
    }

    if (action.status === 'DONE') {
      throw new ValidationError('Corrective action is already completed');
    }

    // Ensure RCA was submitted
    if (!action.rootCauseAnalysis) {
      throw new ValidationError(
        'Cannot complete corrective action without root cause analysis. Please submit RCA first.'
      );
    }

    // Ensure request was accepted
    if (action.requestStatus !== 'ACCEPTED') {
      throw new ValidationError(
        `Cannot complete CAPA in ${action.requestStatus} request state. Expected ACCEPTED.`
      );
    }

    // Resource-based authorization: ADMIN/MANAGER or assigned user can complete
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(user, 'update', { assignedToId: action.assignedToId })
    );

    return this.correctiveActionRepository.updateCorrectiveAction(id, {
      status: 'DONE',
      completedAt: new Date().toISOString(),
      completedBy: user.userId,
    });
  }

  /**
   * Verify the completed corrective action.
   * Transitions status to VERIFIED (stored as DONE with verifiedAt).
   * Only done after action is completed.
   */
  async verifyCorrectiveAction(id: string, verificationNotes: string, currentUser?: JWTPayload) {
    try {
      CorrectiveActionIdSchema.parse(id);
      z.string().min(5).max(2000).parse(verificationNotes);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    const action = await this.correctiveActionRepository.getCorrectiveActionById(id);

    if (!action) {
      throw new NotFoundError('Corrective action not found');
    }

    if (action.status !== 'DONE') {
      throw new ValidationError(
        `Cannot verify CAPA not in DONE state. Current status: ${action.status}`
      );
    }

    if (action.verifiedAt) {
      throw new ValidationError('Corrective action is already verified');
    }

    // Only QA/managers can verify
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(user, 'update', {})
    );

    return this.correctiveActionRepository.updateCorrectiveAction(id, {
      verifiedAt: new Date().toISOString(),
      verifiedBy: user.userId,
      verificationNotes,
    });
  }
}

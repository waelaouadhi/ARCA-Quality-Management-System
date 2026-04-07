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

interface CreateCorrectiveActionInput {
  action: string;
  nonConformanceId: string;
  assignedToId?: string;
  dueDate?: string;
}

interface UpdateCorrectiveActionInput {
  action?: string;
  assignedToId?: string;
  dueDate?: string;
  status?: ActionStatus;
}

export class CorrectiveActionService {
  constructor(private readonly correctiveActionRepository = new CorrectiveActionRepository()) {}

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

    return this.correctiveActionRepository.createCorrectiveAction(input);
  }

  async getCorrectiveActions(
    paginationInput: PaginationInput = {},
    filters: { status?: ActionStatus; nonConformanceId?: string; assignedToId?: string } = {},
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

    // Resource-based authorization: ADMIN/MANAGER or assigned user can complete
    AuthorizationPolicies.correctiveAction.update().authorize(
      createAuthContext(user, 'update', { assignedToId: action.assignedToId })
    );

    return this.correctiveActionRepository.completeCorrectiveAction(id);
  }
}

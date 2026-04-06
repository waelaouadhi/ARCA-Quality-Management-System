import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload } from '@/shared/utils/jwt';
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

const ACTION_WRITE_ROLES = new Set(['ADMIN', 'MANAGER']);

export class CorrectiveActionService {
  constructor(private readonly correctiveActionRepository = new CorrectiveActionRepository()) {}

  private requireAuthenticatedUser(user?: JWTPayload): JWTPayload {
    if (!user) {
      throw new AuthorizationError();
    }

    return user;
  }

  private requireActionWriteRole(user?: JWTPayload): JWTPayload {
    const currentUser = this.requireAuthenticatedUser(user);
    if (!ACTION_WRITE_ROLES.has(currentUser.role)) {
      throw new AuthorizationError('CorrectiveAction write access requires ADMIN or MANAGER role');
    }

    return currentUser;
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

    this.requireActionWriteRole(currentUser);
    return this.correctiveActionRepository.createCorrectiveAction(input);
  }

  async getCorrectiveActions(
    paginationInput: PaginationInput = {},
    filters: { status?: ActionStatus; nonConformanceId?: string; assignedToId?: string } = {},
    currentUser?: JWTPayload
  ) {
    this.requireAuthenticatedUser(currentUser);
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

    this.requireAuthenticatedUser(currentUser);
    const action = await this.correctiveActionRepository.getCorrectiveActionById(id);

    if (!action) {
      throw new NotFoundError('Corrective action not found');
    }

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

    this.requireActionWriteRole(currentUser);
    await this.getCorrectiveActionById(id, currentUser);
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

    this.requireActionWriteRole(currentUser);
    const action = await this.getCorrectiveActionById(id, currentUser);

    if (action.status === 'DONE') {
      throw new ValidationError('Corrective action is already completed');
    }

    return this.correctiveActionRepository.completeCorrectiveAction(id);
  }
}

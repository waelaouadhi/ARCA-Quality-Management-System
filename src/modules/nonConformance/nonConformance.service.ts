import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload } from '@/shared/utils/jwt';
import { NonConformanceRepository } from './nonConformance.repository';
import { z } from 'zod';
import {
  CreateNonConformanceInputSchema,
  UpdateNonConformanceInputSchema,
  NonConformanceIdSchema,
} from './nonConformance.validation';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type NCStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface CreateNonConformanceInput {
  title: string;
  description: string;
  severity?: Severity;
}

interface UpdateNonConformanceInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: NCStatus;
}

const NON_CONFORMANCE_WRITE_ROLES = new Set(['ADMIN', 'MANAGER']);

export class NonConformanceService {
  constructor(private readonly nonConformanceRepository = new NonConformanceRepository()) {}

  private requireAuthenticatedUser(user?: JWTPayload): JWTPayload {
    if (!user) {
      throw new AuthorizationError();
    }

    return user;
  }

  private requireNonConformanceWriteRole(user?: JWTPayload): JWTPayload {
    const currentUser = this.requireAuthenticatedUser(user);
    if (!NON_CONFORMANCE_WRITE_ROLES.has(currentUser.role)) {
      throw new AuthorizationError('NonConformance write access requires ADMIN or MANAGER role');
    }

    return currentUser;
  }

  async createNonConformance(input: CreateNonConformanceInput, currentUser?: JWTPayload) {
    try {
      CreateNonConformanceInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = this.requireNonConformanceWriteRole(currentUser);
    return this.nonConformanceRepository.createNonConformance(input, user.userId);
  }

  async getNonConformances(
    paginationInput: PaginationInput = {},
    filters: { status?: NCStatus; severity?: Severity; reportedById?: string } = {},
    currentUser?: JWTPayload
  ) {
    this.requireAuthenticatedUser(currentUser);
    return this.nonConformanceRepository.getNonConformances(paginationInput, filters);
  }

  async getNonConformanceById(id: string, currentUser?: JWTPayload) {
    try {
      NonConformanceIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    this.requireAuthenticatedUser(currentUser);
    const nonConformance = await this.nonConformanceRepository.getNonConformanceById(id);

    if (!nonConformance) {
      throw new NotFoundError('Non-conformance not found');
    }

    return nonConformance;
  }

  async updateNonConformance(id: string, input: UpdateNonConformanceInput, currentUser?: JWTPayload) {
    try {
      NonConformanceIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    try {
      UpdateNonConformanceInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    this.requireNonConformanceWriteRole(currentUser);
    await this.getNonConformanceById(id, currentUser);
    return this.nonConformanceRepository.updateNonConformance(id, input);
  }

  async closeNonConformance(id: string, currentUser?: JWTPayload) {
    try {
      NonConformanceIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    this.requireNonConformanceWriteRole(currentUser);
    const nonConformance = await this.getNonConformanceById(id, currentUser);

    if (nonConformance.status === 'CLOSED') {
      throw new ValidationError('Non-conformance is already closed');
    }

    return this.nonConformanceRepository.closeNonConformance(id);
  }
}

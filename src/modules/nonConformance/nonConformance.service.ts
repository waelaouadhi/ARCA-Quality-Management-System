import { NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload, requireAuthentication, AuthorizationPolicies, createAuthContext } from '@/shared/utils';
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

export class NonConformanceService {
  constructor(private readonly nonConformanceRepository = new NonConformanceRepository()) {}

  async createNonConformance(input: CreateNonConformanceInput, currentUser?: JWTPayload) {
    try {
      CreateNonConformanceInputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }

    const user = requireAuthentication(currentUser);
    
    // Check authorization
    AuthorizationPolicies.nonConformance.create().authorize(createAuthContext(user, 'create'));

    return this.nonConformanceRepository.createNonConformance(input, user.userId);
  }

  async getNonConformances(
    paginationInput: PaginationInput = {},
    filters: { status?: NCStatus; severity?: Severity; reportedById?: string } = {},
    currentUser?: JWTPayload
  ) {
    const user = requireAuthentication(currentUser);
    
    // Check authorization
    AuthorizationPolicies.nonConformance.read().authorize(createAuthContext(user, 'read'));

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

    const user = requireAuthentication(currentUser);
    const nonConformance = await this.nonConformanceRepository.getNonConformanceById(id);

    if (!nonConformance) {
      throw new NotFoundError('Non-conformance not found');
    }

    // Check authorization
    AuthorizationPolicies.nonConformance.read().authorize(
      createAuthContext(user, 'read', { reportedById: nonConformance.reportedById })
    );

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

    const user = requireAuthentication(currentUser);
    const nonConformance = await this.nonConformanceRepository.getNonConformanceById(id);

    if (!nonConformance) {
      throw new NotFoundError('Non-conformance not found');
    }

    // Resource-based authorization: ADMIN/MANAGER or creator can update
    AuthorizationPolicies.nonConformance.update().authorize(
      createAuthContext(user, 'update', { reportedById: nonConformance.reportedById })
    );

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

    const user = requireAuthentication(currentUser);
    const nonConformance = await this.nonConformanceRepository.getNonConformanceById(id);

    if (!nonConformance) {
      throw new NotFoundError('Non-conformance not found');
    }

    if (nonConformance.status === 'CLOSED') {
      throw new ValidationError('Non-conformance is already closed');
    }

    // Resource-based authorization: ADMIN/MANAGER or creator can close
    AuthorizationPolicies.nonConformance.update().authorize(
      createAuthContext(user, 'update', { reportedById: nonConformance.reportedById })
    );

    return this.nonConformanceRepository.closeNonConformance(id);
  }
}

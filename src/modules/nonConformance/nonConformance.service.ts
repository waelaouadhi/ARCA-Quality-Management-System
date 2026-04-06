import { AuthorizationError, NotFoundError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload } from '@/shared/utils/jwt';
import { CreateNonConformanceSchema, UpdateNonConformanceSchema } from '@/shared/validation/schemas';
import { auditService } from '@/modules/audit/audit.service';
import { NonConformanceRepository } from './nonConformance.repository';

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
    const user = this.requireNonConformanceWriteRole(currentUser);

    const validation = CreateNonConformanceSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError(validation.error.errors.map((e) => e.message).join('; '));
    }

    const nonConformance = await this.nonConformanceRepository.createNonConformance(
      validation.data,
      user.userId
    );

    await auditService.log({
      userId: user.userId,
      action: 'CREATE',
      entity: 'NonConformance',
      entityId: nonConformance.id,
    });

    return nonConformance;
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
    this.requireAuthenticatedUser(currentUser);
    const nonConformance = await this.nonConformanceRepository.getNonConformanceById(id);

    if (!nonConformance) {
      throw new NotFoundError('Non-conformance not found');
    }

    return nonConformance;
  }

  async updateNonConformance(id: string, input: UpdateNonConformanceInput, currentUser?: JWTPayload) {
    const user = this.requireNonConformanceWriteRole(currentUser);

    const validation = UpdateNonConformanceSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError(validation.error.errors.map((e) => e.message).join('; '));
    }

    await this.getNonConformanceById(id, currentUser);
    const updated = await this.nonConformanceRepository.updateNonConformance(id, validation.data);

    await auditService.log({
      userId: user.userId,
      action: 'UPDATE',
      entity: 'NonConformance',
      entityId: id,
    });

    return updated;
  }

  async closeNonConformance(id: string, currentUser?: JWTPayload) {
    const user = this.requireNonConformanceWriteRole(currentUser);
    const nonConformance = await this.getNonConformanceById(id, currentUser);

    if (nonConformance.status === 'CLOSED') {
      throw new ValidationError('Non-conformance is already closed');
    }

    const closed = await this.nonConformanceRepository.closeNonConformance(id);

    await auditService.log({
      userId: user.userId,
      action: 'CLOSE',
      entity: 'NonConformance',
      entityId: id,
    });

    return closed;
  }
}

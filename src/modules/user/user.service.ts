import { NotFoundError, AuthorizationError, ValidationError } from '@/shared/errors';
import { PaginationInput } from '@/shared/utils/pagination';
import { JWTPayload } from '@/shared/utils/jwt';
import { UpdateUserSchema } from '@/shared/validation/schemas';
import { auditService } from '@/modules/audit/audit.service';
import { UserRepository } from './user.repository';

export class UserService {
  constructor(private readonly userRepository = new UserRepository()) {}

  private requireAuthenticatedUser(user?: JWTPayload): JWTPayload {
    if (!user) {
      throw new AuthorizationError();
    }

    return user;
  }

  private requireAdminUser(user?: JWTPayload): JWTPayload {
    const currentUser = this.requireAuthenticatedUser(user);
    if (currentUser.role !== 'ADMIN') {
      throw new AuthorizationError('Admin access required');
    }

    return currentUser;
  }

  async getUsers(paginationInput: PaginationInput, currentUser?: JWTPayload) {
    this.requireAuthenticatedUser(currentUser);
    return this.userRepository.getUsers(paginationInput);
  }

  async getUserById(id: string, currentUser?: JWTPayload) {
    this.requireAuthenticatedUser(currentUser);
    const user = await this.userRepository.getUserById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateUser(id: string, data: any, currentUser?: JWTPayload) {
    const actor = this.requireAuthenticatedUser(currentUser);

    const validation = UpdateUserSchema.safeParse(data);
    if (!validation.success) {
      throw new ValidationError(validation.error.errors.map((e) => e.message).join('; '));
    }

    const updated = await this.userRepository.updateUser(id, validation.data);

    await auditService.log({
      userId: actor.userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
    });

    return updated;
  }

  async deleteUser(id: string, currentUser?: JWTPayload) {
    const actor = this.requireAdminUser(currentUser);
    await this.userRepository.deleteUser(id);

    await auditService.log({
      userId: actor.userId,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
    });

    return true;
  }
}

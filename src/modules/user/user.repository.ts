import prisma from '@/config/database';
import { Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { PaginationInput, paginate } from '@/shared/utils/pagination';

export class UserRepository {
  getUsers(paginationInput: PaginationInput) {
    return paginate(prisma.user, paginationInput, {}, {});
  }

  getUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  updateUser(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundError('User not found');
        }

        if (error.code === 'P2003') {
          throw new ConflictError(
            'Cannot delete this user because it is linked to existing records. Reassign ownership before deleting.',
          );
        }
      }

      throw error;
    }
  }
}

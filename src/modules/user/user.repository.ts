import prisma from '@/config/database';
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
    await prisma.user.delete({
      where: { id },
    });
  }
}

import prisma from '@/config/database';

interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  createUser(data: CreateUserInput) {
    return prisma.user.create({ data });
  }
}

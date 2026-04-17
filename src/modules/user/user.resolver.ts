import { AuthContext } from '@/shared/types/context';
import { UserService } from './user.service';

const userService = new UserService();

export const userResolvers = {
  Query: {
    users: async (_: any, args: any, context: AuthContext) => userService.getUsers(args.pagination, context.user),
    user: async (_: any, args: any, context: AuthContext) => userService.getUserById(args.id, context.user),
  },
  Mutation: {
    updateUser: async (_: any, args: any, context: AuthContext) =>
      userService.updateUser(args.id, args.input, context.user),
    deleteUser: async (_: any, args: any, context: AuthContext) => userService.deleteUser(args.id, context.user),
  },
};

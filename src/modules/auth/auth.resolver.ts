import { AuthContext } from '@/shared/types/context';
import { AuthService } from './auth.service';

const authService = new AuthService();

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: AuthContext) => authService.getCurrentUser(context.user),
  },
  Mutation: {
    register: async (_: any, args: any) => {
      const { email, password, firstName, lastName } = args.input;
      return authService.register(email, password, firstName, lastName);
    },
    login: async (_: any, args: any) => {
      const { email, password } = args.input;
      return authService.login(email, password);
    },
  },
};

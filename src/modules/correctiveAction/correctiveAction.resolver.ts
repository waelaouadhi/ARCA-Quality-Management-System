import { AuthContext } from '@/shared/types/context';
import { CorrectiveActionService } from './correctiveAction.service';

const correctiveActionService = new CorrectiveActionService();

export const correctiveActionResolvers = {
  Query: {
    correctiveActions: async (_: unknown, args: any, context: AuthContext) =>
      correctiveActionService.getCorrectiveActions(
        args.pagination,
        {
          status: args.status,
          nonConformanceId: args.nonConformanceId,
          assignedToId: args.assignedToId,
        },
        context.user
      ),
    correctiveAction: async (_: unknown, args: any, context: AuthContext) =>
      correctiveActionService.getCorrectiveActionById(args.id, context.user),
  },
  Mutation: {
    createCorrectiveAction: async (_: unknown, args: any, context: AuthContext) =>
      correctiveActionService.createCorrectiveAction(args.input, context.user),
    updateCorrectiveAction: async (_: unknown, args: any, context: AuthContext) =>
      correctiveActionService.updateCorrectiveAction(args.id, args.input, context.user),
    completeCorrectiveAction: async (_: unknown, args: any, context: AuthContext) =>
      correctiveActionService.completeCorrectiveAction(args.id, context.user),
  },
};

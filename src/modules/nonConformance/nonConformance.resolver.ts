import { AuthContext } from '@/shared/types/context';
import { NonConformanceService } from './nonConformance.service';

const nonConformanceService = new NonConformanceService();

export const nonConformanceResolvers = {
  Query: {
    nonConformances: async (_: unknown, args: any, context: AuthContext) =>
      nonConformanceService.getNonConformances(
        args.pagination,
        {
          status: args.status,
          severity: args.severity,
          reportedById: args.reportedById,
        },
        context.user
      ),
    nonConformance: async (_: unknown, args: any, context: AuthContext) =>
      nonConformanceService.getNonConformanceById(args.id, context.user),
  },
  Mutation: {
    createNonConformance: async (_: unknown, args: any, context: AuthContext) =>
      nonConformanceService.createNonConformance(args.input, context.user),
    updateNonConformance: async (_: unknown, args: any, context: AuthContext) =>
      nonConformanceService.updateNonConformance(args.id, args.input, context.user),
    closeNonConformance: async (_: unknown, args: any, context: AuthContext) =>
      nonConformanceService.closeNonConformance(args.id, context.user),
  },
};

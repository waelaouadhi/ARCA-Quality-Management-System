import { DashboardService } from './dashboard.service';
import prisma from '@/config/database';

const dashboardService = new DashboardService(prisma);

export const dashboardResolvers = {
  Query: {
    getDashboard: async (_: any, _args: any, _context: any) => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return await dashboardService.getExecutiveDashboard(thirtyDaysAgo, today);
    },
  },

  Mutation: {
    refreshDashboardMetrics: async (_: any, _args: any, _context: any) => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return await dashboardService.getExecutiveDashboard(thirtyDaysAgo, today);
    },
  },
};

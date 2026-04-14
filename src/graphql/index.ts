import { baseTypeDefs, baseResolvers } from './base';
import { authTypeDefs, authResolvers } from '@/modules/auth';
import { userTypeDefs, userResolvers } from '@/modules/user';
import { documentTypeDefs, documentResolvers } from '@/modules/document';
import { nonConformanceTypeDefs, nonConformanceResolvers } from '@/modules/nonConformance';
import { correctiveActionTypeDefs, correctiveActionResolvers } from '@/modules/correctiveAction';
import { dashboardTypeDefs, dashboardResolvers } from '@/modules/dashboard';
import { permissionTypeDefs, permissionResolvers } from '@/modules/permission';

export const typeDefs = [
  baseTypeDefs,
  authTypeDefs,
  userTypeDefs,
  documentTypeDefs,
  nonConformanceTypeDefs,
  correctiveActionTypeDefs,
  dashboardTypeDefs,
  permissionTypeDefs,
];

export const resolvers = {
  Query: {
    ...baseResolvers.Query,
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...documentResolvers.Query,
    ...nonConformanceResolvers.Query,
    ...correctiveActionResolvers.Query,
    ...dashboardResolvers.Query,
    ...permissionResolvers.Query,
  },
  Mutation: {
    ...baseResolvers.Mutation,
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...documentResolvers.Mutation,
    ...nonConformanceResolvers.Mutation,
    ...correctiveActionResolvers.Mutation,
    ...dashboardResolvers.Mutation,
    ...permissionResolvers.Mutation,
  },
};

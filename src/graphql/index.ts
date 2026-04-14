import { baseTypeDefs, baseResolvers } from './base';
import { authTypeDefs, authResolvers } from '@/modules/auth';
import { userTypeDefs, userResolvers } from '@/modules/user';
import { documentTypeDefs, documentResolvers } from '@/modules/document';
import { nonConformanceTypeDefs, nonConformanceResolvers } from '@/modules/nonConformance';
import { correctiveActionTypeDefs, correctiveActionResolvers } from '@/modules/correctiveAction';
import { dashboardTypeDefs, dashboardResolvers } from '@/modules/dashboard';
import { permissionTypeDefs, permissionResolvers } from '@/modules/permission';
import { workflowTypeDefs, workflowResolvers } from '@/modules/workflow';
import { auditTypeDefs, auditResolvers } from '@/modules/audit';
import { riskTypeDefs, riskResolvers } from '@/modules/risk';
import { supplierTypeDefs, supplierResolvers } from '@/modules/supplier';
import { complaintTypeDefs, complaintResolvers } from '@/modules/complaint';
import { trainingTypeDefs, trainingResolvers } from '@/modules/training';

export const typeDefs = [
  baseTypeDefs,
  authTypeDefs,
  userTypeDefs,
  documentTypeDefs,
  nonConformanceTypeDefs,
  correctiveActionTypeDefs,
  dashboardTypeDefs,
  permissionTypeDefs,
  workflowTypeDefs,
  auditTypeDefs,
  riskTypeDefs,
  supplierTypeDefs,
  complaintTypeDefs,
  trainingTypeDefs,
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
    ...workflowResolvers.Query,
    ...auditResolvers.Query,
    ...riskResolvers.Query,
    ...supplierResolvers.Query,
    ...complaintResolvers.Query,
    ...trainingResolvers.Query,
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
    ...workflowResolvers.Mutation,
    ...auditResolvers.Mutation,
    ...riskResolvers.Mutation,
    ...supplierResolvers.Mutation,
    ...complaintResolvers.Mutation,
    ...trainingResolvers.Mutation,
  },
};

import { requireAuthentication } from '@/shared/utils';
import { supplierService } from './supplier.service';
import {
  createSupplierSchema,
  updateSupplierSchema,
  addContactSchema,
  createAuditSchema,
  addAuditFindingSchema,
  createEvaluationSchema,
  createIssueSchema,
  updateIssueStatusSchema,
  linkIssueToCapaSchema,
  supplierIdSchema,
} from './supplier.validation';

export const supplierResolvers = {
  Supplier: {
    supplierCode: (parent: any) => parent.supplierNumber ?? null,
    phone: (parent: any) => parent.primaryContact ?? null,
    email: () => null,
    qualityRating: (parent: any) => parent.ratingScore ?? null,
    deliveryRating: (parent: any) => parent.complianceScore ?? null,
    riskLevel: (parent: any) => {
      const score = Number(parent.complianceScore ?? 0);
      if (score < 40) return 'HIGH';
      if (score < 70) return 'MEDIUM';
      return 'LOW';
    },
    notes: (parent: any) => parent.description ?? null,
  },
  Query: {
    supplier: async (_: any, { id }: any, context: any) => {
      try {
        requireAuthentication(context);
        supplierIdSchema.parse(id);
        const data = await supplierService.getSupplier(id);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    suppliers: async (_: any, { skip = 0, take = 10 }: any, context: any) => {
      try {
        requireAuthentication(context);
        const result = await supplierService.getAllSuppliers(skip, take);
        return { success: true, data: result.suppliers, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message, data: [], total: 0 };
      }
    },

    suppliersByCategory: async (
      _: any,
      { category, skip = 0, take = 10 }: any,
      context: any
    ) => {
      try {
        requireAuthentication(context);
        const result = await supplierService.getSuppliersByCategory(
          category,
          skip,
          take
        );
        return { success: true, data: result.suppliers, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message, data: [], total: 0 };
      }
    },

    suppliersByStatus: async (
      _: any,
      { status, skip = 0, take = 10 }: any,
      context: any
    ) => {
      try {
        requireAuthentication(context);
        const result = await supplierService.getSuppliersByStatus(
          status,
          skip,
          take
        );
        return { success: true, data: result.suppliers, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message, data: [], total: 0 };
      }
    },

    supplierContacts: async (_: any, { supplierId }: any, context: any) => {
      try {
        requireAuthentication(context);
        supplierIdSchema.parse(supplierId);
        const contacts = await supplierService.getContacts(supplierId);
        return { success: true, data: contacts[0] ?? null };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    supplierAudits: async (
      _: any,
      { supplierId, skip = 0, take = 10 }: any,
      context: any
    ) => {
      try {
        requireAuthentication(context);
        supplierIdSchema.parse(supplierId);
        const result = await supplierService.getAudits(supplierId, skip, take);
        return { success: true, data: result.audits, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message, data: [], total: 0 };
      }
    },

    supplierAuditFindings: async (_: any, { auditId }: any, context: any) => {
      try {
        requireAuthentication(context);
        supplierIdSchema.parse(auditId);
        return await supplierService.getAuditFindings(auditId);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch audit findings');
      }
    },

    supplierEvaluations: async (
      _: any,
      { supplierId, skip = 0, take = 10 }: any,
      context: any
    ) => {
      try {
        requireAuthentication(context);
        supplierIdSchema.parse(supplierId);
        const result = await supplierService.getEvaluations(supplierId, skip, take);
        return { success: true, data: result.evaluations, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message, data: [], total: 0 };
      }
    },

    supplierIssues: async (
      _: any,
      { supplierId, skip = 0, take = 10 }: any,
      context: any
    ) => {
      try {
        requireAuthentication(context);
        supplierIdSchema.parse(supplierId);
        const result = await supplierService.getIssues(supplierId, skip, take);
        return { success: true, data: result.issues, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message, data: [], total: 0 };
      }
    },

    topSuppliers: async (_: any, { limit = 10 }: any, context: any) => {
      try {
        requireAuthentication(context);
        const data = await supplierService.getTopSuppliers(limit);
        return { success: true, data, total: data.length };
      } catch (error: any) {
        return { success: false, message: error.message, data: [], total: 0 };
      }
    },

    lowPerformingSuppliers: async (
      _: any,
      { complianceThreshold, limit }: any,
      context: any
    ) => {
      try {
        requireAuthentication(context);
        const data = await supplierService.getLowPerformingSuppliers(
          complianceThreshold,
          limit
        );
        return { success: true, data, total: data.length };
      } catch (error: any) {
        return { success: false, message: error.message, data: [], total: 0 };
      }
    },

    supplierStatistics: async (_: any, __: any, context: any) => {
      try {
        requireAuthentication(context);
        return await supplierService.getSupplierStatistics();
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch supplier statistics');
      }
    },
  },

  Mutation: {
    createSupplier: async (
      _: any,
      {
        name,
        description,
        category,
        primaryContact,
        phone,
        email,
        website,
      }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = createSupplierSchema.parse({
          name,
          description,
          category,
          primaryContact:
            primaryContact ??
            phone ??
            email ??
            null,
          website,
        });
        const data = await supplierService.createSupplier(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    updateSupplier: async (
      _: any,
      {
        id,
        name,
        description,
        category,
        status,
        primaryContact,
        phone,
        email,
        website,
        ratingScore,
        qualityRating,
        complianceScore,
        deliveryRating,
      }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = updateSupplierSchema.parse({
          id,
          name,
          description,
          category,
          status,
          primaryContact: primaryContact ?? phone ?? email ?? null,
          website,
          ratingScore: ratingScore ?? qualityRating,
          complianceScore: complianceScore ?? deliveryRating,
        });
        const data = await supplierService.updateSupplier(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    deleteSupplier: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        supplierIdSchema.parse(id);
        await supplierService.deleteSupplier(user, id);
        return true;
      } catch (error: any) {
        throw new Error(error.message || 'Failed to delete supplier');
      }
    },

    addSupplierContact: async (
      _: any,
      { supplierId, name, role, email, phone }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = addContactSchema.parse({
          supplierId,
          name,
          role,
          email,
          phone,
        });
        const data = await supplierService.addContact(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    createSupplierAudit: async (
      _: any,
      { supplierId, auditDate, auditType, auditScore }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = createAuditSchema.parse({
          supplierId,
          auditDate,
          auditType,
          auditScore,
        });
        const data = await supplierService.createAudit(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    addAuditFinding: async (
      _: any,
      { auditId, severity, description, evidence }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = addAuditFindingSchema.parse({
          auditId,
          severity,
          description,
          evidence,
        });
        const data = await supplierService.addAuditFinding(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    createSupplierEvaluation: async (
      _: any,
      { supplierId, evaluationDate, qualityScore, deliveryScore, priceScore, notes }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = createEvaluationSchema.parse({
          supplierId,
          evaluationDate,
          qualityScore,
          deliveryScore,
          priceScore,
          notes,
        });
        const data = await supplierService.createEvaluation(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    createSupplierIssue: async (
      _: any,
      { supplierId, auditId, description, severity }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = createIssueSchema.parse({
          supplierId,
          auditId,
          description,
          severity,
        });
        const data = await supplierService.createIssue(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    updateSupplierIssueStatus: async (
      _: any,
      { issueId, status }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = updateIssueStatusSchema.parse({
          issueId,
          status,
        });
        const data = await supplierService.updateIssueStatus(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    linkSupplierIssueToCAPA: async (
      _: any,
      { issueId, capaId }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = linkIssueToCapaSchema.parse({
          issueId,
          capaId,
        });
        const data = await supplierService.linkIssueToCapa(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  },
};

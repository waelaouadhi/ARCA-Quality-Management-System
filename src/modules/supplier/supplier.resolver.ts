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
  Query: {
    supplier: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        supplierIdSchema.parse(id);
        return await supplierService.getSupplier(id);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch supplier');
      }
    },

    suppliers: async (_: any, { skip = 0, take = 10 }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        return await supplierService.getAllSuppliers(skip, take);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch suppliers');
      }
    },

    suppliersByCategory: async (_: any, { category, skip = 0, take = 10 }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        return await supplierService.getSuppliersByCategory(category, skip, take);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch suppliers by category');
      }
    },

    suppliersByStatus: async (_: any, { status, skip = 0, take = 10 }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        return await supplierService.getSuppliersByStatus(status, skip, take);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch suppliers by status');
      }
    },

    supplierContacts: async (_: any, { supplierId }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        supplierIdSchema.parse(supplierId);
        return await supplierService.getContacts(supplierId);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch supplier contacts');
      }
    },

    supplierAudits: async (_: any, { supplierId, skip = 0, take = 10 }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        supplierIdSchema.parse(supplierId);
        return await supplierService.getAudits(supplierId, skip, take);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch supplier audits');
      }
    },

    supplierAuditFindings: async (_: any, { auditId }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        supplierIdSchema.parse(auditId);
        return await supplierService.getAuditFindings(auditId);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch audit findings');
      }
    },

    supplierEvaluations: async (_: any, { supplierId, skip = 0, take = 10 }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        supplierIdSchema.parse(supplierId);
        return await supplierService.getEvaluations(supplierId, skip, take);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch supplier evaluations');
      }
    },

    supplierIssues: async (_: any, { supplierId, skip = 0, take = 10 }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        supplierIdSchema.parse(supplierId);
        return await supplierService.getIssues(supplierId, skip, take);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch supplier issues');
      }
    },

    topSuppliers: async (_: any, { limit = 10 }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        return await supplierService.getTopSuppliers(limit);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch top suppliers');
      }
    },

    lowPerformingSuppliers: async (_: any, { complianceThreshold, limit }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        return await supplierService.getLowPerformingSuppliers(complianceThreshold, limit);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch low performing suppliers');
      }
    },

    supplierStatistics: async (_: any, __: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        return await supplierService.getSupplierStatistics();
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch supplier statistics');
      }
    },
  },

  Mutation: {
    createSupplier: async (_: any, { name, description, category, primaryContact, website }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = createSupplierSchema.parse({
          name,
          description,
          category,
          primaryContact,
          website,
        });
        return await supplierService.createSupplier(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create supplier');
      }
    },

    updateSupplier: async (_: any, { id, name, description, category, status, primaryContact, website, ratingScore, complianceScore }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = updateSupplierSchema.parse({
          id,
          name,
          description,
          category,
          status,
          primaryContact,
          website,
          ratingScore,
          complianceScore,
        });
        return await supplierService.updateSupplier(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to update supplier');
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

    addSupplierContact: async (_: any, { supplierId, name, role, email, phone }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = addContactSchema.parse({
          supplierId,
          name,
          role,
          email,
          phone,
        });
        return await supplierService.addContact(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to add supplier contact');
      }
    },

    createSupplierAudit: async (_: any, { supplierId, auditDate, auditType, auditScore }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = createAuditSchema.parse({
          supplierId,
          auditDate,
          auditType,
          auditScore,
        });
        return await supplierService.createAudit(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create supplier audit');
      }
    },

    addAuditFinding: async (_: any, { auditId, severity, description, evidence }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = addAuditFindingSchema.parse({
          auditId,
          severity,
          description,
          evidence,
        });
        return await supplierService.addAuditFinding(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to add audit finding');
      }
    },

    createSupplierEvaluation: async (_: any, { supplierId, evaluationDate, qualityScore, deliveryScore, priceScore, notes }: any, context: any) => {
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
        return await supplierService.createEvaluation(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create supplier evaluation');
      }
    },

    createSupplierIssue: async (_: any, { supplierId, auditId, description, severity }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = createIssueSchema.parse({
          supplierId,
          auditId,
          description,
          severity,
        });
        return await supplierService.createIssue(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create supplier issue');
      }
    },

    updateSupplierIssueStatus: async (_: any, { issueId, status }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = updateIssueStatusSchema.parse({
          issueId,
          status,
        });
        return await supplierService.updateIssueStatus(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to update issue status');
      }
    },

    linkSupplierIssueToCAPA: async (_: any, { issueId, capaId }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = linkIssueToCapaSchema.parse({
          issueId,
          capaId,
        });
        return await supplierService.linkIssueToCapa(user, input);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to link issue to CAPA');
      }
    },
  },
};

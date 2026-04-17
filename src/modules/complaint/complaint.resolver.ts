import { requireAuthentication } from '@/shared/utils';
import { complaintService } from './complaint.service';
import {
  createComplaintSchema,
  updateComplaintSchema,
  createInvestigationSchema,
  addAttachmentSchema,
  complaintIdSchema,
} from './complaint.validation';

export const complaintResolvers = {
  Query: {
    complaint: async (_: any, { id }: any, context: any) => {
      try {
        requireAuthentication(context);
        complaintIdSchema.parse(id);
        const data = await complaintService.getComplaint(id);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    complaints: async (_: any, { skip = 0, take = 10 }: any, context: any) => {
      try {
        requireAuthentication(context);
        const result = await complaintService.getAllComplaints(skip, take);
        return { success: true, data: result.complaints, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    complaintsByStatus: async (
      _: any,
      { status, skip = 0, take = 10 }: any,
      context: any
    ) => {
      try {
        requireAuthentication(context);
        const result = await complaintService.getComplaintsByStatus(status, skip, take);
        return { success: true, data: result.complaints, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    complaintsBySeverity: async (
      _: any,
      { severity, skip = 0, take = 10 }: any,
      context: any
    ) => {
      try {
        requireAuthentication(context);
        const result = await complaintService.getComplaintsBySeverity(severity, skip, take);
        return { success: true, data: result.complaints, total: result.total };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    complaintAttachments: async (_: any, { complaintId }: any, context: any) => {
      try {
        requireAuthentication(context);
        return await complaintService.getAttachments(complaintId);
      } catch (error: any) {
        throw new Error(error.message);
      }
    },

    complaintStatistics: async (_: any, __: any, context: any) => {
      try {
        requireAuthentication(context);
        return await complaintService.getStatistics();
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
  },

  Mutation: {
    createComplaint: async (
      _: any,
      {
        title,
        description,
        category,
        source,
        severity,
        reportedDate,
        customerName,
        customerEmail,
        customerPhone,
        reportedBy,
      }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = createComplaintSchema.parse({
          title,
          description,
          category,
          source,
          severity,
          reportedDate,
          customerName,
          customerEmail,
          customerPhone,
          reportedBy,
        });
        const data = await complaintService.createComplaint(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    updateComplaint: async (
      _: any,
      { id, title, status, findings, rootCause }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = updateComplaintSchema.parse({
          id,
          title,
          status,
          findings,
          rootCause,
        });
        const data = await complaintService.updateComplaint(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    startInvestigation: async (
      _: any,
      { complaintId, methodology, immediateActions }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = createInvestigationSchema.parse({
          complaintId,
          methodology,
          immediateActions,
        });
        const data = await complaintService.startInvestigation(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    closeInvestigation: async (
      _: any,
      { complaintId, findings }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        complaintIdSchema.parse(complaintId);
        const data = await complaintService.closeInvestigation(user, complaintId, findings);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    addComplaintAttachment: async (
      _: any,
      { complaintId, filename, fileUrl, fileType, fileSize, description }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const input = addAttachmentSchema.parse({
          complaintId,
          filename,
          fileUrl,
          fileType,
          fileSize,
          description,
        });
        const data = await complaintService.addAttachment(user, input);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    linkComplaintToRisk: async (
      _: any,
      { complaintId, riskId }: any,
      context: any
    ) => {
      try {
        const user = requireAuthentication(context);
        const data = await complaintService.linkRisk(user, complaintId, riskId);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },

    deleteComplaint: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        complaintIdSchema.parse(id);
        await complaintService.deleteComplaint(user, id);
        return true;
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
  },
};

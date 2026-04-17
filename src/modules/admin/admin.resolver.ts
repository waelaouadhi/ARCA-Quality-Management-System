import { AdminService } from './admin.service';
import { JWTPayload } from '@/shared/utils';
import * as adminSchemas from './admin.schema';

const adminService = new AdminService();

export const adminResolvers = {
  Query: {
    // Get seeded workflows
    async adminGetWorkflows(_: any, __: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const workflows = await adminService.getSeededWorkflows(user);

        return {
          success: true,
          data: workflows,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: [],
        };
      }
    },

    // Get audit templates
    async adminGetAuditTemplates(
      _: any,
      { includeArchived = false }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const templates = await adminService.getAuditTemplates(
          user,
          includeArchived
        );

        return {
          success: true,
          data: templates,
          count: templates.length,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: [],
          count: 0,
        };
      }
    },

    // Get single audit template
    async adminGetAuditTemplate(_: any, { id }: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const template = await adminService.getAuditTemplate(user, id);

        return {
          success: true,
          data: template,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    // Get dashboard metrics
    async adminGetDashboardMetrics(_: any, __: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const metrics = await adminService.getDashboardMetrics(user);

        return {
          success: true,
          data: metrics,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    // Get system status
    async adminGetSystemStatus(_: any, __: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const status = await adminService.getSystemStatus(user);

        return {
          success: true,
          data: status,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },
  },

  Mutation: {
    // Seed workflows
    async adminSeedWorkflows(_: any, __: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const result = await adminService.seedWorkflows(user);

        return {
          success: result.success,
          message: result.message,
          data: result.seededWorkflows,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: [],
        };
      }
    },

    // Create audit template
    async adminCreateAuditTemplate(
      _: any,
      { input }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        // Validate input
        const validatedInput = adminSchemas.createAuditTemplateInputSchema.parse(
          input
        );

        const template = await adminService.createAuditTemplate(
          user,
          validatedInput
        );

        return {
          success: true,
          data: template,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    // Update audit template
    async adminUpdateAuditTemplate(
      _: any,
      { id, input }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const validatedInput = adminSchemas.updateAuditTemplateInputSchema.parse(
          input
        );

        const template = await adminService.updateAuditTemplate(
          user,
          id,
          validatedInput
        );

        return {
          success: true,
          data: template,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    // Archive audit template
    async adminArchiveAuditTemplate(
      _: any,
      { id }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const template = await adminService.archiveAuditTemplate(user, id);

        return {
          success: true,
          data: template,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    // Clone audit template
    async adminCloneAuditTemplate(
      _: any,
      { sourceId, newName }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        if (!user) {
          throw new Error('Unauthorized');
        }

        const template = await adminService.cloneAuditTemplate(
          user,
          sourceId,
          newName
        );

        return {
          success: true,
          data: template,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },
  },
};

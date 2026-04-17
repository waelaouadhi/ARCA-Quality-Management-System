import { AuditService } from './audit.service';
import { JWTPayload } from '@/shared/utils';

const auditService = new AuditService();

export const auditResolvers = {
  Query: {
    async getAudits(
      _: any,
      { skip = 0, take = 10, status, auditType }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const result = await auditService.getAudits(
          { skip, take } as any,
          { status, auditType },
          user
        );

        return {
          success: true,
          data: result.audits,
          total: result.total,
          skip: result.skip,
          take: result.take,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: [],
          total: 0,
          skip,
          take,
        };
      }
    },

    async getAuditById(_: any, { id }: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        const audit = await auditService.getAuditById(id, user);

        return {
          success: true,
          data: audit,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    async getAuditTemplates(_: any, __: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        const templates = await auditService.getTemplates(user);

        return {
          success: true,
          data: templates,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: [],
        };
      }
    },
  },

  Mutation: {
    async createAudit(
      _: any,
      {
        title,
        description,
        auditType,
        auditScope,
        auditDate,
        templateId,
        auditTeamIds,
      }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const audit = await auditService.createAudit(
          {
            title,
            description,
            auditType,
            auditScope,
            auditDate,
            templateId,
            auditTeamIds,
          },
          user
        );

        return {
          success: true,
          message: 'Audit created successfully',
          data: audit,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    async updateAudit(
      _: any,
      { id, title, description, status }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const audit = await auditService.updateAudit(
          id,
          { title, description, status },
          user
        );

        return {
          success: true,
          message: 'Audit updated successfully',
          data: audit,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    async createAuditFinding(
      _: any,
      { auditId, description, severity }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const finding = await auditService.createFinding(
          { auditId, description, severity },
          user
        );

        return {
          success: true,
          message: 'Finding created successfully',
          data: finding,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    async createAuditTemplate(
      _: any,
      { name, description, questions }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const template = await auditService.createTemplate(
          { name, description, questions },
          user
        );

        return {
          success: true,
          message: 'Template created successfully',
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

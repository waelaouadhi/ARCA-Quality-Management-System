import { RiskService } from './risk.service';
import { JWTPayload } from '@/shared/utils';

const riskService = new RiskService();

export const riskResolvers = {
  Query: {
    async getRisks(
      _: any,
      { skip = 0, take = 10, status, riskType }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const result = await riskService.getRisks(
          { skip, take } as any,
          { status, riskType },
          user
        );

        return {
          success: true,
          data: result.risks,
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

    async getRiskById(_: any, { id }: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        const risk = await riskService.getRiskById(id, user);

        return {
          success: true,
          data: risk,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    async getRiskControls(_: any, { riskId }: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        const controls = await riskService.getControls(riskId, user);

        return controls;
      } catch (error: any) {
        console.error('Error fetching risk controls:', error);
        return [];
      }
    },

    async getRiskAssessments(_: any, { riskId }: any, context: any) {
      try {
        const user: JWTPayload | undefined = context.user;
        const assessments = await riskService.getAssessments(riskId, user);

        return assessments;
      } catch (error: any) {
        console.error('Error fetching risk assessments:', error);
        return [];
      }
    },
  },

  Mutation: {
    async createRisk(
      _: any,
      {
        title,
        description,
        riskType,
        process,
        inherentProbability,
        inherentImpact,
        ownerId,
      }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const risk = await riskService.createRisk(
          {
            title,
            description,
            riskType,
            process,
            inherentProbability,
            inherentImpact,
            ownerId,
          },
          user
        );

        return {
          success: true,
          message: 'Risk created successfully',
          data: risk,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    async updateRisk(
      _: any,
      {
        id,
        title,
        description,
        status,
        residualProbability,
        residualImpact,
        ownerId,
      }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const risk = await riskService.updateRisk(
          id,
          {
            title,
            description,
            status,
            residualProbability,
            residualImpact,
            ownerId,
          },
          user
        );

        return {
          success: true,
          message: 'Risk updated successfully',
          data: risk,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    async createRiskControl(
      _: any,
      { riskId, name, controlType, description }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const control = await riskService.createControl(
          { riskId, controlName: name, controlType, description },
          user
        );

        return {
          success: true,
          message: 'Control created successfully',
          data: control,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    },

    async createRiskAssessment(
      _: any,
      { riskId, probability, impact }: any,
      context: any
    ) {
      try {
        const user: JWTPayload | undefined = context.user;
        const assessment = await riskService.createAssessment(
          { riskId, probability, impact },
          user
        );

        return {
          success: true,
          message: 'Assessment created successfully',
          data: assessment,
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

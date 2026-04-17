import { requireAuthentication } from '@/shared/utils';
import { trainingService } from './training.service';
import {
  createTrainingProgramSchema,
  updateTrainingProgramSchema,
  createTrainingCourseSchema,
  updateTrainingCourseSchema,
  createTrainingScheduleSchema,
  updateTrainingScheduleSchema,
  enrollEmployeeSchema,
  completeTrainingSchema,
  updateEnrollmentStatusSchema,
  createCertificationSchema,
  updateCertificationSchema,
  trainingProgramFilterSchema,
  trainingCourseFilterSchema,
  trainingScheduleFilterSchema,
  employeeTrainingFilterSchema,
  certificationFilterSchema,
  idSchema,
} from './training.validation';

export const trainingResolvers = {
  Query: {
    // Programs
    trainingProgram: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        return await trainingService.getProgram(id);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch training program');
      }
    },

    listTrainingPrograms: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const filters = trainingProgramFilterSchema.parse(args);
        return await trainingService.listPrograms(filters);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to list training programs');
      }
    },

    // Courses
    trainingCourse: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        return await trainingService.getCourse(id);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch training course');
      }
    },

    listTrainingCourses: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const filters = trainingCourseFilterSchema.parse(args);
        return await trainingService.listCourses(filters);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to list training courses');
      }
    },

    // Schedules
    trainingSchedule: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        return await trainingService.getSchedule(id);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch training schedule');
      }
    },

    listTrainingSchedules: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const filters = trainingScheduleFilterSchema.parse(args);
        return await trainingService.listSchedules(filters);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to list training schedules');
      }
    },

    // Enrollments
    employeeTraining: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        return await trainingService.getEnrollment(id);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch employee training');
      }
    },

    listEmployeeTrainings: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const filters = employeeTrainingFilterSchema.parse(args);
        return await trainingService.listEnrollments(filters);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to list employee trainings');
      }
    },

    // Certifications
    trainingCertification: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        return await trainingService.getCertification(id);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch training certification');
      }
    },

    listTrainingCertifications: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const filters = certificationFilterSchema.parse(args);
        return await trainingService.listCertifications(filters);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to list training certifications');
      }
    },

    // Analytics
    employeeCompetencies: async (_: any, { employeeId }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(employeeId);
        return await trainingService.getEmployeeCompetencies(employeeId);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch employee competencies');
      }
    },

    scheduleStatistics: async (_: any, { scheduleId }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(scheduleId);
        return await trainingService.getScheduleStatistics(scheduleId);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch schedule statistics');
      }
    },

    expiringCertifications: async (_: any, { days }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        return await trainingService.getExpiringCertifications(days || 30);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch expiring certifications');
      }
    },
  },

  Mutation: {
    // Programs
    createTrainingProgram: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = createTrainingProgramSchema.parse(args);
        const data = await trainingService.createProgram(user, input);
        return { success: true, message: 'Training program created', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    updateTrainingProgram: async (_: any, { id, ...rest }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        const input = updateTrainingProgramSchema.parse(rest);
        const data = await trainingService.updateProgram(user, id, input);
        return { success: true, message: 'Training program updated', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    deleteTrainingProgram: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        await trainingService.deleteProgram(user, id);
        return { success: true, message: 'Training program deleted', data: null };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    // Courses
    createTrainingCourse: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = createTrainingCourseSchema.parse(args);
        const data = await trainingService.createCourse(user, input);
        return { success: true, message: 'Training course created', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    updateTrainingCourse: async (_: any, { id, ...rest }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        const input = updateTrainingCourseSchema.parse(rest);
        const data = await trainingService.updateCourse(user, id, input);
        return { success: true, message: 'Training course updated', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    deleteTrainingCourse: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        await trainingService.deleteCourse(user, id);
        return { success: true, message: 'Training course deleted', data: null };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    // Schedules
    createTrainingSchedule: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = createTrainingScheduleSchema.parse(args);
        const data = await trainingService.createSchedule(user, input);
        return { success: true, message: 'Training schedule created', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    updateTrainingSchedule: async (_: any, { id, ...rest }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        const input = updateTrainingScheduleSchema.parse(rest);
        const data = await trainingService.updateSchedule(user, id, input);
        return { success: true, message: 'Training schedule updated', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    deleteTrainingSchedule: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        await trainingService.deleteSchedule(user, id);
        return { success: true, message: 'Training schedule deleted', data: null };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    // Enrollments
    enrollEmployee: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = enrollEmployeeSchema.parse(args);
        const data = await trainingService.enrollEmployee(user, input);
        return { success: true, message: 'Employee enrolled', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    completeTraining: async (_: any, { enrollmentId, ...rest }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(enrollmentId);
        const input = completeTrainingSchema.parse(rest);
        const data = await trainingService.completeTraining(user, enrollmentId, input);
        return { success: true, message: 'Training completed', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    updateEnrollmentStatus: async (_: any, { enrollmentId, ...rest }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(enrollmentId);
        const input = updateEnrollmentStatusSchema.parse(rest);
        const data = await trainingService.updateEnrollmentStatus(user, enrollmentId, input);
        return { success: true, message: 'Enrollment status updated', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    unenrollEmployee: async (_: any, { enrollmentId }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(enrollmentId);
        await trainingService.unenrollEmployee(user, enrollmentId);
        return { success: true, message: 'Employee unenrolled', data: null };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    // Certifications
    createTrainingCertification: async (_: any, args: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        const input = createCertificationSchema.parse(args);
        const data = await trainingService.createCertification(user, input);
        return { success: true, message: 'Certification created', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    updateTrainingCertification: async (_: any, { id, ...rest }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        const input = updateCertificationSchema.parse(rest);
        const data = await trainingService.updateCertification(user, id, input);
        return { success: true, message: 'Certification updated', data };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },

    deleteTrainingCertification: async (_: any, { id }: any, context: any) => {
      try {
        const user = requireAuthentication(context);
        idSchema.parse(id);
        await trainingService.deleteCertification(user, id);
        return { success: true, message: 'Certification deleted', data: null };
      } catch (error: any) {
        return { success: false, message: error.message, data: null };
      }
    },
  },
};

import trainingRepository from './training.repository';
import { JWTPayload, requireRole } from '@/shared/utils';
import { AppError, NotFoundError, ValidationError } from '@/shared/errors';
import {
  CreateTrainingProgramInput,
  UpdateTrainingProgramInput,
  CreateTrainingCourseInput,
  UpdateTrainingCourseInput,
  CreateTrainingScheduleInput,
  UpdateTrainingScheduleInput,
  EnrollEmployeeInput,
  CompleteTrainingInput,
  UpdateEnrollmentStatusInput,
  CreateCertificationInput,
  UpdateCertificationInput,
} from './training.validation';

export class TrainingService {
  private repo = trainingRepository;

  // =====================================================
  // TRAINING PROGRAM OPERATIONS
  // =====================================================

  async createProgram(user: JWTPayload, input: CreateTrainingProgramInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);
    
    if (!input.name?.trim()) {
      throw new ValidationError('Program name is required');
    }

    return this.repo.createProgram({
      name: input.name,
      description: input.description,
      type: input.type || 'OPTIONAL',
      requiredCompetencies: input.requiredCompetencies,
      durationHours: input.durationHours,
      targetAudience: input.targetAudience,
    });
  }

  async getProgram(id: string) {
    const program = await this.repo.getProgramById(id);
    if (!program) {
      throw new NotFoundError(`Training program not found: ${id}`);
    }
    return program;
  }

  async listPrograms(filters: any) {
    return this.repo.listPrograms(filters);
  }

  async updateProgram(user: JWTPayload, id: string, input: UpdateTrainingProgramInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const existing = await this.repo.getProgramById(id);
    if (!existing) {
      throw new NotFoundError(`Training program not found: ${id}`);
    }

    return this.repo.updateProgram(id, input);
  }

  async deleteProgram(user: JWTPayload, id: string) {
    requireRole(user, ['ADMIN']);

    const existing = await this.repo.getProgramById(id);
    if (!existing) {
      throw new NotFoundError(`Training program not found: ${id}`);
    }

    await this.repo.deleteProgram(id);
  }

  // =====================================================
  // TRAINING COURSE OPERATIONS
  // =====================================================

  async createCourse(user: JWTPayload, input: CreateTrainingCourseInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const program = await this.repo.getProgramById(input.programId);
    if (!program) {
      throw new NotFoundError(`Training program not found: ${input.programId}`);
    }

    return this.repo.createCourse({
      name: input.name,
      description: input.description,
      content: input.content,
      durationHours: input.durationHours,
      numberOfModules: input.numberOfModules,
      instructorId: input.instructorId,
      programId: input.programId,
      targetCompetency: input.targetCompetency,
      competencyLevel: input.competencyLevel,
    });
  }

  async getCourse(id: string) {
    const course = await this.repo.getCourseById(id);
    if (!course) {
      throw new NotFoundError(`Training course not found: ${id}`);
    }
    return course;
  }

  async listCourses(filters: any) {
    return this.repo.listCourses(filters);
  }

  async updateCourse(user: JWTPayload, id: string, input: UpdateTrainingCourseInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const existing = await this.repo.getCourseById(id);
    if (!existing) {
      throw new NotFoundError(`Training course not found: ${id}`);
    }

    return this.repo.updateCourse(id, input);
  }

  async deleteCourse(user: JWTPayload, id: string) {
    requireRole(user, ['ADMIN']);

    const existing = await this.repo.getCourseById(id);
    if (!existing) {
      throw new NotFoundError(`Training course not found: ${id}`);
    }

    await this.repo.deleteCourse(id);
  }

  // =====================================================
  // TRAINING SCHEDULE OPERATIONS
  // =====================================================

  async createSchedule(user: JWTPayload, input: CreateTrainingScheduleInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const [course, program] = await Promise.all([
      this.repo.getCourseById(input.courseId),
      this.repo.getProgramById(input.programId),
    ]);

    if (!course) throw new NotFoundError(`Course not found: ${input.courseId}`);
    if (!program) throw new NotFoundError(`Program not found: ${input.programId}`);

    return this.repo.createSchedule({
      courseId: input.courseId,
      programId: input.programId,
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      deliveryMethod: input.deliveryMethod || 'IN_PERSON',
      maxParticipants: input.maxParticipants,
    });
  }

  async getSchedule(id: string) {
    const schedule = await this.repo.getScheduleById(id);
    if (!schedule) {
      throw new NotFoundError(`Training schedule not found: ${id}`);
    }
    return schedule;
  }

  async listSchedules(filters: any) {
    return this.repo.listSchedules(filters);
  }

  async updateSchedule(user: JWTPayload, id: string, input: UpdateTrainingScheduleInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const existing = await this.repo.getScheduleById(id);
    if (!existing) {
      throw new NotFoundError(`Training schedule not found: ${id}`);
    }

    return this.repo.updateSchedule(id, input);
  }

  async deleteSchedule(user: JWTPayload, id: string) {
    requireRole(user, ['ADMIN']);

    const existing = await this.repo.getScheduleById(id);
    if (!existing) {
      throw new NotFoundError(`Training schedule not found: ${id}`);
    }

    await this.repo.deleteSchedule(id);
  }

  // =====================================================
  // EMPLOYEE ENROLLMENT OPERATIONS
  // =====================================================

  async enrollEmployee(user: JWTPayload, input: EnrollEmployeeInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const schedule = await this.repo.getScheduleById(input.scheduleId);
    if (!schedule) throw new NotFoundError(`Schedule not found: ${input.scheduleId}`);

    const course = await this.repo.getCourseById(schedule.courseId);
    if (!course) throw new NotFoundError('Course not found');

    const program = await this.repo.getProgramById(schedule.programId);
    if (!program) throw new NotFoundError('Program not found');

    if (schedule.currentEnrollment >= schedule.maxParticipants) {
      throw new AppError('Schedule is full, cannot enroll more participants');
    }

    const enrollment = await this.repo.enrollEmployee({
      employeeId: input.employeeId,
      scheduleId: input.scheduleId,
      courseId: schedule.courseId,
      programId: schedule.programId,
      assignedBy: user.userId,
      dueDate: input.dueDate,
    });

    return enrollment;
  }

  async getEnrollment(id: string) {
    const enrollment = await this.repo.getEnrollmentById(id);
    if (!enrollment) {
      throw new NotFoundError(`Enrollment not found: ${id}`);
    }
    return enrollment;
  }

  async listEnrollments(filters: any) {
    return this.repo.listEnrollments(filters);
  }

  async completeTraining(user: JWTPayload, enrollmentId: string, input: CompleteTrainingInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const enrollment = await this.repo.getEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw new NotFoundError(`Enrollment not found: ${enrollmentId}`);
    }

    if (input.score !== undefined && (input.score < 0 || input.score > 100)) {
      throw new ValidationError('Score must be between 0 and 100');
    }

    return this.repo.updateEnrollment(enrollmentId, {
      status: 'COMPLETED',
      attendanceHours: input.attendanceHours,
      score: input.score,
      gradeReceived: input.gradeReceived,
      feedback: input.feedback,
      certificateUrl: input.certificateUrl,
      completedDate: new Date(),
      certificateIssuedDate: input.certificateUrl ? new Date() : undefined,
    });
  }

  async updateEnrollmentStatus(user: JWTPayload, enrollmentId: string, input: UpdateEnrollmentStatusInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const enrollment = await this.repo.getEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw new NotFoundError(`Enrollment not found: ${enrollmentId}`);
    }

    return this.repo.updateEnrollment(enrollmentId, {
      status: input.status,
    });
  }

  async unenrollEmployee(user: JWTPayload, enrollmentId: string) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const enrollment = await this.repo.getEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw new NotFoundError(`Enrollment not found: ${enrollmentId}`);
    }

    await this.repo.unenrollEmployee(enrollmentId);
  }

  // =====================================================
  // CERTIFICATION OPERATIONS
  // =====================================================

  async createCertification(user: JWTPayload, input: CreateCertificationInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    return this.repo.createCertification({
      employeeId: input.employeeId,
      certificationName: input.certificationName,
      issuingBody: input.issuingBody,
      certificationCode: input.certificationCode,
      issuedDate: input.issuedDate,
      expiryDate: input.expiryDate,
      programId: input.programId,
      documentUrl: input.documentUrl,
      documentType: input.documentType,
    });
  }

  async getCertification(id: string) {
    const cert = await this.repo.getCertificationById(id);
    if (!cert) {
      throw new NotFoundError(`Certification not found: ${id}`);
    }
    return cert;
  }

  async listCertifications(filters: any) {
    return this.repo.listCertifications(filters);
  }

  async updateCertification(user: JWTPayload, id: string, input: UpdateCertificationInput) {
    requireRole(user, ['ADMIN', 'MANAGER']);

    const existing = await this.repo.getCertificationById(id);
    if (!existing) {
      throw new NotFoundError(`Certification not found: ${id}`);
    }

    return this.repo.updateCertification(id, input);
  }

  async deleteCertification(user: JWTPayload, id: string) {
    requireRole(user, ['ADMIN']);

    const existing = await this.repo.getCertificationById(id);
    if (!existing) {
      throw new NotFoundError(`Certification not found: ${id}`);
    }

    await this.repo.deleteCertification(id);
  }

  // =====================================================
  // COMPETENCY & ANALYTICS
  // =====================================================

  async getEmployeeCompetencies(employeeId: string) {
    return this.repo.getEmployeeCompetencies(employeeId);
  }

  async getScheduleStatistics(scheduleId: string) {
    const schedule = await this.repo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${scheduleId}`);
    }

    const stats = await this.repo.getScheduleEnrollmentStats(scheduleId);
    return {
      schedule,
      stats,
    };
  }

  async getExpiringCertifications(days: number = 30) {
    return this.repo.getExpiringCertifications(days);
  }
}

export const trainingService = new TrainingService();
export default trainingService;

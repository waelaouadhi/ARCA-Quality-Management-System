import prisma from '@/config/database';
import { TrainingProgram, TrainingCourse, TrainingSchedule, EmployeeTraining, TrainingCertification, TrainingType, TrainingStatus, CertificationStatus } from '@prisma/client';

export class TrainingRepository {
  // =====================================================
  // TRAINING PROGRAM METHODS
  // =====================================================

  async generateProgramNumber(): Promise<string> {
    const count = await prisma.trainingProgram.count();
    const nextNumber = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `TRAIN-PROG-${year}-${nextNumber}`;
  }

  async createProgram(data: {
    name: string;
    description: string;
    type?: TrainingType;
    requiredCompetencies?: string[];
    durationHours: number;
    targetAudience?: string;
  }): Promise<TrainingProgram> {
    const programNumber = await this.generateProgramNumber();
    return prisma.trainingProgram.create({
      data: {
        ...data,
        programNumber,
        type: data.type || TrainingType.OPTIONAL,
      },
    });
  }

  async getProgramById(id: string): Promise<TrainingProgram | null> {
    return prisma.trainingProgram.findUnique({
      where: { id },
      include: {
        courses: true,
        schedules: true,
      },
    });
  }

  async listPrograms(filters: {
    type?: string;
    status?: string;
    searchQuery?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: TrainingProgram[]; total: number }> {
    const where: any = {};

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.trainingProgram.findMany({
        where,
        skip: filters.skip || 0,
        take: filters.take || 10,
        include: { courses: true, schedules: true },
      }),
      prisma.trainingProgram.count({ where }),
    ]);

    return { data, total };
  }

  async updateProgram(
    id: string,
    data: {
      name?: string;
      description?: string;
      type?: TrainingType;
      requiredCompetencies?: string[];
      durationHours?: number;
      targetAudience?: string;
      status?: string;
    }
  ): Promise<TrainingProgram> {
    return prisma.trainingProgram.update({
      where: { id },
      data: data as any,
    });
  }

  async deleteProgram(id: string): Promise<void> {
    await prisma.trainingProgram.delete({ where: { id } });
  }

  // =====================================================
  // TRAINING COURSE METHODS
  // =====================================================

  async generateCourseNumber(): Promise<string> {
    const count = await prisma.trainingCourse.count();
    const nextNumber = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `TRAIN-COURSE-${year}-${nextNumber}`;
  }

  async createCourse(data: {
    name: string;
    description: string;
    content?: string;
    durationHours: number;
    numberOfModules?: number;
    instructorId?: string;
    programId: string;
    targetCompetency?: string;
    competencyLevel?: string;
  }): Promise<TrainingCourse> {
    const courseNumber = await this.generateCourseNumber();
    return prisma.trainingCourse.create({
      data: {
        ...data,
        courseNumber,
      },
      include: { program: true, instructor: true },
    });
  }

  async getCourseById(id: string): Promise<TrainingCourse | null> {
    return prisma.trainingCourse.findUnique({
      where: { id },
      include: {
        program: true,
        instructor: true,
        schedules: true,
        enrollments: true,
      },
    });
  }

  async listCourses(filters: {
    programId?: string;
    status?: string;
    competencyLevel?: string;
    searchQuery?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: TrainingCourse[]; total: number }> {
    const where: any = {};

    if (filters.programId) where.programId = filters.programId;
    if (filters.status) where.status = filters.status;
    if (filters.competencyLevel) where.competencyLevel = filters.competencyLevel;
    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.trainingCourse.findMany({
        where,
        skip: filters.skip || 0,
        take: filters.take || 10,
        include: { program: true, instructor: true, schedules: true },
      }),
      prisma.trainingCourse.count({ where }),
    ]);

    return { data, total };
  }

  async updateCourse(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      durationHours?: number;
      numberOfModules?: number;
      instructorId?: string;
      targetCompetency?: string;
      competencyLevel?: string;
      status?: string;
    }
  ): Promise<TrainingCourse> {
    return prisma.trainingCourse.update({
      where: { id },
      data,
    });
  }

  async deleteCourse(id: string): Promise<void> {
    await prisma.trainingCourse.delete({ where: { id } });
  }

  // =====================================================
  // TRAINING SCHEDULE METHODS
  // =====================================================

  async generateScheduleNumber(): Promise<string> {
    const count = await prisma.trainingSchedule.count();
    const nextNumber = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `TRAIN-SCHED-${year}-${nextNumber}`;
  }

  async createSchedule(data: {
    courseId: string;
    programId: string;
    startDate: Date;
    endDate: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    deliveryMethod?: string;
    maxParticipants?: number;
  }): Promise<TrainingSchedule> {
    const scheduleNumber = await this.generateScheduleNumber();
    return prisma.trainingSchedule.create({
      data: {
        ...data,
        scheduleNumber,
      },
      include: { course: true, program: true },
    });
  }

  async getScheduleById(id: string): Promise<TrainingSchedule | null> {
    return prisma.trainingSchedule.findUnique({
      where: { id },
      include: {
        course: true,
        program: true,
        enrollments: true,
      },
    });
  }

  async listSchedules(filters: {
    courseId?: string;
    programId?: string;
    status?: string;
    deliveryMethod?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }): Promise<{ data: TrainingSchedule[]; total: number }> {
    const where: any = {};

    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.programId) where.programId = filters.programId;
    if (filters.status) where.status = filters.status;
    if (filters.deliveryMethod) where.deliveryMethod = filters.deliveryMethod;
    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate.gte = filters.startDate;
      if (filters.endDate) where.startDate.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.trainingSchedule.findMany({
        where,
        skip: filters.skip || 0,
        take: filters.take || 10,
        include: { course: true, program: true, enrollments: true },
      }),
      prisma.trainingSchedule.count({ where }),
    ]);

    return { data, total };
  }

  async updateSchedule(
    id: string,
    data: {
      startDate?: Date;
      endDate?: Date;
      startTime?: string;
      endTime?: string;
      location?: string;
      deliveryMethod?: string;
      maxParticipants?: number;
      status?: string;
    }
  ): Promise<TrainingSchedule> {
    return prisma.trainingSchedule.update({
      where: { id },
      data,
    });
  }

  async deleteSchedule(id: string): Promise<void> {
    await prisma.trainingSchedule.delete({ where: { id } });
  }

  // =====================================================
  // EMPLOYEE TRAINING (ENROLLMENT) METHODS
  // =====================================================

  async generateEnrollmentNumber(): Promise<string> {
    const count = await prisma.employeeTraining.count();
    const nextNumber = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `ENROLL-${year}-${nextNumber}`;
  }

  async enrollEmployee(data: {
    employeeId: string;
    scheduleId: string;
    courseId: string;
    programId: string;
    assignedBy?: string;
    dueDate?: Date;
  }): Promise<EmployeeTraining> {
    const enrollmentNumber = await this.generateEnrollmentNumber();
    return prisma.employeeTraining.create({
      data: {
        ...data,
        enrollmentNumber,
      },
      include: { employee: true, schedule: true, course: true, program: true },
    });
  }

  async getEnrollmentById(id: string): Promise<EmployeeTraining | null> {
    return prisma.employeeTraining.findUnique({
      where: { id },
      include: {
        employee: true,
        schedule: true,
        course: true,
        program: true,
      },
    });
  }

  async listEnrollments(filters: {
    employeeId?: string;
    scheduleId?: string;
    courseId?: string;
    programId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: EmployeeTraining[]; total: number }> {
    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.scheduleId) where.scheduleId = filters.scheduleId;
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.programId) where.programId = filters.programId;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      prisma.employeeTraining.findMany({
        where,
        skip: filters.skip || 0,
        take: filters.take || 10,
        include: { employee: true, schedule: true, course: true, program: true },
      }),
      prisma.employeeTraining.count({ where }),
    ]);

    return { data, total };
  }

  async updateEnrollment(
    id: string,
    data: {
      status?: TrainingStatus;
      attendanceHours?: number;
      score?: number;
      gradeReceived?: string;
      feedback?: string;
      certificateUrl?: string;
      certificateIssuedDate?: Date;
      completedDate?: Date;
    }
  ): Promise<EmployeeTraining> {
    return prisma.employeeTraining.update({
      where: { id },
      data: data as any,
    });
  }

  async unenrollEmployee(id: string): Promise<void> {
    await prisma.employeeTraining.delete({ where: { id } });
  }

  // =====================================================
  // TRAINING CERTIFICATION METHODS
  // =====================================================

  async generateCertificationNumber(): Promise<string> {
    const count = await prisma.trainingCertification.count();
    const nextNumber = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `CERT-${year}-${nextNumber}`;
  }

  async createCertification(data: {
    employeeId: string;
    certificationName: string;
    issuingBody?: string;
    certificationCode?: string;
    issuedDate: Date;
    expiryDate?: Date;
    programId?: string;
    documentUrl?: string;
    documentType?: string;
  }): Promise<TrainingCertification> {
    const certNumber = await this.generateCertificationNumber();
    return prisma.trainingCertification.create({
      data: {
        ...data,
        certNumber,
      },
      include: { employee: true, program: true },
    });
  }

  async getCertificationById(id: string): Promise<TrainingCertification | null> {
    return prisma.trainingCertification.findUnique({
      where: { id },
      include: { employee: true, program: true },
    });
  }

  async listCertifications(filters: {
    employeeId?: string;
    status?: string;
    programId?: string;
    searchQuery?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: TrainingCertification[]; total: number }> {
    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.programId) where.programId = filters.programId;
    if (filters.searchQuery) {
      where.OR = [
        { certificationName: { contains: filters.searchQuery, mode: 'insensitive' } },
        { issuingBody: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.trainingCertification.findMany({
        where,
        skip: filters.skip || 0,
        take: filters.take || 10,
        include: { employee: true, program: true },
      }),
      prisma.trainingCertification.count({ where }),
    ]);

    return { data, total };
  }

  async updateCertification(
    id: string,
    data: {
      certificationName?: string;
      issuingBody?: string;
      certificationCode?: string;
      issuedDate?: Date;
      expiryDate?: Date;
      renewalDate?: Date;
      status?: CertificationStatus;
      documentUrl?: string;
      documentType?: string;
    }
  ): Promise<TrainingCertification> {
    return prisma.trainingCertification.update({
      where: { id },
      data: data as any,
    });
  }

  async deleteCertification(id: string): Promise<void> {
    await prisma.trainingCertification.delete({ where: { id } });
  }

  // =====================================================
  // COMPETENCY TRACKING & ANALYTICS
  // =====================================================

  async getEmployeeCompetencies(employeeId: string): Promise<{
    completedTrainings: number;
    certifications: TrainingCertification[];
    enrolledPrograms: TrainingProgram[];
  }> {
    const [trainings, certifications, programs] = await Promise.all([
      prisma.employeeTraining.count({
        where: {
          employeeId,
          status: 'COMPLETED',
        },
      }),
      prisma.trainingCertification.findMany({
        where: { employeeId, status: 'VALID' },
        include: { program: true },
      }),
      prisma.trainingProgram.findMany({
        where: {
          enrollments: {
            some: {
              employeeId,
              status: { in: ['IN_PROGRESS', 'PENDING'] },
            },
          },
        },
      }),
    ]);

    return {
      completedTrainings: trainings,
      certifications,
      enrolledPrograms: programs,
    };
  }

  async getScheduleEnrollmentStats(scheduleId: string): Promise<{
    totalEnrolled: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
  }> {
    const enrollments = await prisma.employeeTraining.findMany({
      where: { scheduleId },
      select: { status: true },
    });

    return {
      totalEnrolled: enrollments.length,
      completed: enrollments.filter(e => e.status === 'COMPLETED').length,
      inProgress: enrollments.filter(e => e.status === 'IN_PROGRESS').length,
      pending: enrollments.filter(e => e.status === 'PENDING').length,
      failed: enrollments.filter(e => e.status === 'FAILED').length,
    };
  }

  async getExpiringCertifications(days: number = 30): Promise<TrainingCertification[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return prisma.trainingCertification.findMany({
      where: {
        status: 'VALID',
        expiryDate: {
          lte: targetDate,
          gte: new Date(),
        },
      },
      include: { employee: true, program: true },
    });
  }
}

export default new TrainingRepository();

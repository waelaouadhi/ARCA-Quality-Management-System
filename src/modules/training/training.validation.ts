import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-z0-9]{25}$/);

// Training Program Schemas
export const createTrainingProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  type: z.enum(['MANDATORY', 'OPTIONAL', 'COMPLIANCE', 'TECHNICAL', 'SOFT_SKILLS']).default('OPTIONAL'),
  requiredCompetencies: z.array(z.string()).optional(),
  durationHours: z.number().positive(),
  targetAudience: z.string().optional(),
});

export const updateTrainingProgramSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['MANDATORY', 'OPTIONAL', 'COMPLIANCE', 'TECHNICAL', 'SOFT_SKILLS']).optional(),
  requiredCompetencies: z.array(z.string()).optional(),
  durationHours: z.number().positive().optional(),
  targetAudience: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DISCONTINUED']).optional(),
});

// Training Course Schemas
export const createTrainingCourseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  content: z.string().optional(),
  durationHours: z.number().positive(),
  numberOfModules: z.number().int().positive().default(1),
  instructorId: z.string().optional(),
  programId: idSchema,
  targetCompetency: z.string().optional(),
  competencyLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
});

export const updateTrainingCourseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  content: z.string().optional(),
  durationHours: z.number().positive().optional(),
  numberOfModules: z.number().int().positive().optional(),
  instructorId: z.string().optional(),
  targetCompetency: z.string().optional(),
  competencyLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DISCONTINUED']).optional(),
});

// Training Schedule Schemas
export const createTrainingScheduleSchema = z.object({
  courseId: idSchema,
  programId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  deliveryMethod: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).default('IN_PERSON'),
  maxParticipants: z.number().int().positive().default(30),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updateTrainingScheduleSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  deliveryMethod: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).optional(),
  maxParticipants: z.number().int().positive().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

// Employee Training (Enrollment) Schemas
export const enrollEmployeeSchema = z.object({
  employeeId: idSchema,
  scheduleId: idSchema,
  dueDate: z.coerce.date().optional(),
});

export const completeTrainingSchema = z.object({
  attendanceHours: z.number().nonnegative().optional(),
  score: z.number().min(0).max(100).optional(),
  gradeReceived: z.enum(['PASS', 'FAIL']).optional(),
  feedback: z.string().optional(),
  certificateUrl: z.string().url().optional(),
});

export const updateEnrollmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']),
});

// Training Certification Schemas
export const createCertificationSchema = z.object({
  employeeId: idSchema,
  certificationName: z.string().min(1).max(255),
  issuingBody: z.string().optional(),
  certificationCode: z.string().optional(),
  issuedDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
  programId: idSchema.optional(),
  documentUrl: z.string().url().optional(),
  documentType: z.string().optional(),
});

export const updateCertificationSchema = z.object({
  certificationName: z.string().min(1).max(255).optional(),
  issuingBody: z.string().optional(),
  certificationCode: z.string().optional(),
  issuedDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
  status: z.enum(['VALID', 'EXPIRED', 'PENDING_RENEWAL', 'REVOKED']).optional(),
  documentUrl: z.string().url().optional(),
  documentType: z.string().optional(),
});

// Filter schemas
export const trainingProgramFilterSchema = z.object({
  type: z.enum(['MANDATORY', 'OPTIONAL', 'COMPLIANCE', 'TECHNICAL', 'SOFT_SKILLS']).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DISCONTINUED']).optional(),
  searchQuery: z.string().optional(),
  skip: z.number().int().nonnegative().default(0),
  take: z.number().int().positive().default(10),
});

export const trainingCourseFilterSchema = z.object({
  programId: idSchema.optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DISCONTINUED']).optional(),
  competencyLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  searchQuery: z.string().optional(),
  skip: z.number().int().nonnegative().default(0),
  take: z.number().int().positive().default(10),
});

export const trainingScheduleFilterSchema = z.object({
  courseId: idSchema.optional(),
  programId: idSchema.optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  deliveryMethod: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  skip: z.number().int().nonnegative().default(0),
  take: z.number().int().positive().default(10),
});

export const employeeTrainingFilterSchema = z.object({
  employeeId: idSchema.optional(),
  scheduleId: idSchema.optional(),
  courseId: idSchema.optional(),
  programId: idSchema.optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  skip: z.number().int().nonnegative().default(0),
  take: z.number().int().positive().default(10),
});

export const certificationFilterSchema = z.object({
  employeeId: idSchema.optional(),
  status: z.enum(['VALID', 'EXPIRED', 'PENDING_RENEWAL', 'REVOKED']).optional(),
  programId: idSchema.optional(),
  searchQuery: z.string().optional(),
  skip: z.number().int().nonnegative().default(0),
  take: z.number().int().positive().default(10),
});

export type CreateTrainingProgramInput = z.infer<typeof createTrainingProgramSchema>;
export type UpdateTrainingProgramInput = z.infer<typeof updateTrainingProgramSchema>;
export type CreateTrainingCourseInput = z.infer<typeof createTrainingCourseSchema>;
export type UpdateTrainingCourseInput = z.infer<typeof updateTrainingCourseSchema>;
export type CreateTrainingScheduleInput = z.infer<typeof createTrainingScheduleSchema>;
export type UpdateTrainingScheduleInput = z.infer<typeof updateTrainingScheduleSchema>;
export type EnrollEmployeeInput = z.infer<typeof enrollEmployeeSchema>;
export type CompleteTrainingInput = z.infer<typeof completeTrainingSchema>;
export type UpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;

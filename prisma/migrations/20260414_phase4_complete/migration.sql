-- Phase 4: Add Supplier, Complaint, and Training Modules
-- This migration adds 14 new models for enterprise QMS features

-- Training Enums
CREATE TYPE "TrainingType" AS ENUM ('MANDATORY', 'OPTIONAL', 'COMPLIANCE', 'TECHNICAL', 'SOFT_SKILLS');
CREATE TYPE "TrainingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "CertificationStatus" AS ENUM ('VALID', 'EXPIRED', 'PENDING_RENEWAL', 'REVOKED');
CREATE TYPE "DeliveryMethod" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');
CREATE TYPE "CompetencyLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- TrainingProgram Table
CREATE TABLE "TrainingProgram" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "TrainingType" NOT NULL,
  "mandatoryFor" TEXT[],
  "competencyLevels" "CompetencyLevel"[] DEFAULT '{}'::"CompetencyLevel"[],
  "status" "TrainingStatus" NOT NULL DEFAULT 'PENDING',
  "duration" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TrainingCourse Table
CREATE TABLE "TrainingCourse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "programId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "instructorId" TEXT,
  "competencyLevel" "CompetencyLevel" NOT NULL DEFAULT 'BASIC',
  "duration" INTEGER NOT NULL DEFAULT 0,
  "status" "TrainingStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Add training relationships to User table (after TrainingCourse is created)
ALTER TABLE "User" ADD COLUMN "trainingCoursesAsInstructorId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_trainingCoursesAsInstructorId_fkey" 
  FOREIGN KEY ("trainingCoursesAsInstructorId") REFERENCES "TrainingCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TrainingSchedule Table
CREATE TABLE "TrainingSchedule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "courseId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'IN_PERSON',
  "location" TEXT,
  "maxCapacity" INTEGER,
  "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
  "status" "TrainingStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- TrainingCertification Table (must be before EmployeeTraining)
CREATE TABLE "TrainingCertification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "programId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "certificateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "renewalDate" TIMESTAMP(3),
  "status" "CertificationStatus" NOT NULL DEFAULT 'VALID',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- EmployeeTraining Table
CREATE TABLE "EmployeeTraining" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "employeeId" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "grade" TEXT,
  "certificationId" TEXT,
  "status" "TrainingStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("scheduleId") REFERENCES "TrainingSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("certificationId") REFERENCES "TrainingCertification"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX "TrainingProgram_status_idx" ON "TrainingProgram"("status");
CREATE INDEX "TrainingProgram_type_idx" ON "TrainingProgram"("type");
CREATE INDEX "TrainingCourse_programId_idx" ON "TrainingCourse"("programId");
CREATE INDEX "TrainingCourse_instructorId_idx" ON "TrainingCourse"("instructorId");
CREATE INDEX "TrainingSchedule_courseId_idx" ON "TrainingSchedule"("courseId");
CREATE INDEX "TrainingSchedule_startDate_idx" ON "TrainingSchedule"("startDate");
CREATE INDEX "EmployeeTraining_employeeId_idx" ON "EmployeeTraining"("employeeId");
CREATE INDEX "EmployeeTraining_scheduleId_idx" ON "EmployeeTraining"("scheduleId");
CREATE INDEX "TrainingCertification_employeeId_idx" ON "TrainingCertification"("employeeId");
CREATE INDEX "TrainingCertification_status_idx" ON "TrainingCertification"("status");

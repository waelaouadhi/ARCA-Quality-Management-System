-- CreateEnum
CREATE TYPE "EscalationLevel" AS ENUM ('NONE', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('NONE', 'ACTIVE', 'RESOLVED', 'PAUSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP', 'WEBSOCKET', 'SMS', 'SLACK');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RETRYING');

-- AlterTable
ALTER TABLE "NonConformance" ADD COLUMN     "dueDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SLARule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" "Severity" NOT NULL,
    "departmentId" TEXT,
    "escalationLevels" "EscalationLevel"[] DEFAULT ARRAY['LEVEL_1', 'LEVEL_2', 'LEVEL_3']::"EscalationLevel"[],
    "level1DelayHours" INTEGER NOT NULL DEFAULT 0,
    "level2DelayHours" INTEGER NOT NULL DEFAULT 24,
    "level3DelayHours" INTEGER NOT NULL DEFAULT 48,
    "level1Recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "level2Recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "level3Recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notifyChannels" "NotificationChannel"[] DEFAULT ARRAY['EMAIL', 'IN_APP']::"NotificationChannel"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLARule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonConformanceEscalation" (
    "id" TEXT NOT NULL,
    "nonConformanceId" TEXT NOT NULL,
    "currentLevel" "EscalationLevel" NOT NULL DEFAULT 'NONE',
    "escalationStatus" "EscalationStatus" NOT NULL DEFAULT 'NONE',
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "overdueAt" TIMESTAMP(3),
    "lastEscalatedAt" TIMESTAMP(3),
    "nextEscalationAt" TIMESTAMP(3),
    "appliedSLARuleId" TEXT,
    "level1NotifiedAt" TIMESTAMP(3),
    "level2NotifiedAt" TIMESTAMP(3),
    "level3NotifiedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonConformanceEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveActionEscalation" (
    "id" TEXT NOT NULL,
    "correctiveActionId" TEXT NOT NULL,
    "currentLevel" "EscalationLevel" NOT NULL DEFAULT 'NONE',
    "escalationStatus" "EscalationStatus" NOT NULL DEFAULT 'NONE',
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "overdueAt" TIMESTAMP(3),
    "lastEscalatedAt" TIMESTAMP(3),
    "nextEscalationAt" TIMESTAMP(3),
    "appliedSLARuleId" TEXT,
    "level1NotifiedAt" TIMESTAMP(3),
    "level2NotifiedAt" TIMESTAMP(3),
    "level3NotifiedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveActionEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationHistory" (
    "id" TEXT NOT NULL,
    "ncEscalationId" TEXT,
    "caEscalationId" TEXT,
    "eventType" TEXT NOT NULL,
    "escalationLevel" "EscalationLevel" NOT NULL,
    "reason" TEXT,
    "triggeredBy" TEXT,
    "notificationsId" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "escalationLevel" "EscalationLevel" NOT NULL,
    "recipientEmail" TEXT,
    "recipientUserId" TEXT,
    "channels" "NotificationChannel"[],
    "channelStatuses" TEXT NOT NULL DEFAULT '{}',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SLARule_name_key" ON "SLARule"("name");

-- CreateIndex
CREATE INDEX "SLARule_severity_idx" ON "SLARule"("severity");

-- CreateIndex
CREATE INDEX "SLARule_departmentId_idx" ON "SLARule"("departmentId");

-- CreateIndex
CREATE INDEX "SLARule_isActive_idx" ON "SLARule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NonConformanceEscalation_nonConformanceId_key" ON "NonConformanceEscalation"("nonConformanceId");

-- CreateIndex
CREATE INDEX "NonConformanceEscalation_nonConformanceId_idx" ON "NonConformanceEscalation"("nonConformanceId");

-- CreateIndex
CREATE INDEX "NonConformanceEscalation_escalationStatus_idx" ON "NonConformanceEscalation"("escalationStatus");

-- CreateIndex
CREATE INDEX "NonConformanceEscalation_isOverdue_idx" ON "NonConformanceEscalation"("isOverdue");

-- CreateIndex
CREATE INDEX "NonConformanceEscalation_nextEscalationAt_idx" ON "NonConformanceEscalation"("nextEscalationAt");

-- CreateIndex
CREATE UNIQUE INDEX "CorrectiveActionEscalation_correctiveActionId_key" ON "CorrectiveActionEscalation"("correctiveActionId");

-- CreateIndex
CREATE INDEX "CorrectiveActionEscalation_correctiveActionId_idx" ON "CorrectiveActionEscalation"("correctiveActionId");

-- CreateIndex
CREATE INDEX "CorrectiveActionEscalation_escalationStatus_idx" ON "CorrectiveActionEscalation"("escalationStatus");

-- CreateIndex
CREATE INDEX "CorrectiveActionEscalation_isOverdue_idx" ON "CorrectiveActionEscalation"("isOverdue");

-- CreateIndex
CREATE INDEX "CorrectiveActionEscalation_nextEscalationAt_idx" ON "CorrectiveActionEscalation"("nextEscalationAt");

-- CreateIndex
CREATE INDEX "EscalationHistory_ncEscalationId_idx" ON "EscalationHistory"("ncEscalationId");

-- CreateIndex
CREATE INDEX "EscalationHistory_caEscalationId_idx" ON "EscalationHistory"("caEscalationId");

-- CreateIndex
CREATE INDEX "EscalationHistory_eventType_idx" ON "EscalationHistory"("eventType");

-- CreateIndex
CREATE INDEX "EscalationHistory_createdAt_idx" ON "EscalationHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_nextRetryAt_idx" ON "Notification"("nextRetryAt");

-- CreateIndex
CREATE INDEX "Notification_idempotencyKey_idx" ON "Notification"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CorrectiveAction_status_idx" ON "CorrectiveAction"("status");

-- CreateIndex
CREATE INDEX "CorrectiveAction_dueDate_idx" ON "CorrectiveAction"("dueDate");

-- CreateIndex
CREATE INDEX "CorrectiveAction_assignedToId_idx" ON "CorrectiveAction"("assignedToId");

-- CreateIndex
CREATE INDEX "NonConformance_severity_idx" ON "NonConformance"("severity");

-- CreateIndex
CREATE INDEX "NonConformance_status_idx" ON "NonConformance"("status");

-- CreateIndex
CREATE INDEX "NonConformance_dueDate_idx" ON "NonConformance"("dueDate");

-- AddForeignKey
ALTER TABLE "NonConformanceEscalation" ADD CONSTRAINT "NonConformanceEscalation_nonConformanceId_fkey" FOREIGN KEY ("nonConformanceId") REFERENCES "NonConformance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformanceEscalation" ADD CONSTRAINT "NonConformanceEscalation_appliedSLARuleId_fkey" FOREIGN KEY ("appliedSLARuleId") REFERENCES "SLARule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveActionEscalation" ADD CONSTRAINT "CorrectiveActionEscalation_correctiveActionId_fkey" FOREIGN KEY ("correctiveActionId") REFERENCES "CorrectiveAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveActionEscalation" ADD CONSTRAINT "CorrectiveActionEscalation_appliedSLARuleId_fkey" FOREIGN KEY ("appliedSLARuleId") REFERENCES "SLARule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationHistory" ADD CONSTRAINT "EscalationHistory_ncEscalationId_fkey" FOREIGN KEY ("ncEscalationId") REFERENCES "NonConformanceEscalation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationHistory" ADD CONSTRAINT "EscalationHistory_caEscalationId_fkey" FOREIGN KEY ("caEscalationId") REFERENCES "CorrectiveActionEscalation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

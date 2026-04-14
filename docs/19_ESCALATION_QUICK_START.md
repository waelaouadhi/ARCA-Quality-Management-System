# 🚀 Escalation System - Quick Start Guide

## 5-Minute Setup

### 1. Update Database Schema

```bash
# Update prisma/schema.prisma with new enums and models
# (Already done - see ESCALATION_SYSTEM.md for schema details)

# Run migration
npx prisma migrate dev --name add_escalation_system

# Generate client
npx prisma generate
```

### 2. Seed SLA Rules

```typescript
// In your seed script or startup:
import { PrismaClient } from '@prisma/client';
import { seedSLARules } from '@/modules/escalation/sla.config';

const prisma = new PrismaClient();
await seedSLARules(prisma);
```

### 3. Initialize Worker

**Option A: Simple Cron (Development)**
```typescript
// src/index.ts or server startup
import { EscalationWorker } from '@/modules/escalation';

const escalationWorker = new EscalationWorker(prisma);
await escalationWorker.start(); // Runs every 5 minutes automatically
```

**Option B: Manual Trigger (Testing)**
```typescript
// POST /api/escalation/trigger
const worker = new EscalationWorker(prisma);
const batch = await worker.runOnce();
res.json(batch);
```

### 4. Integrate with Services

**Non-Conformance Service:**
```typescript
async createNC(user: JWTPayload, input: CreateNCInput) {
  const nc = await prisma.nonConformance.create({
    data: {
      title: input.title,
      severity: input.severity,
      dueDate: input.dueDate,
      reportedById: user.userId,
    },
  });

  // Auto-create escalation state
  await prisma.nonConformanceEscalation.create({
    data: {
      nonConformanceId: nc.id,
      isOverdue: nc.dueDate < new Date(),
    },
  });

  return nc;
}
```

---

## Usage Examples

### Check Current Escalation State

```typescript
import { EscalationService } from '@/modules/escalation';

const escalationService = new EscalationService(prisma);

const state = await escalationService.getState('nc-001', 'NonConformance');
console.log(state);
// {
//   currentLevel: 'LEVEL_2',
//   escalationStatus: 'ACTIVE',
//   isOverdue: true,
//   lastEscalatedAt: 2024-04-07T14:30:00Z,
//   level1NotifiedAt: 2024-04-07T10:00:00Z,
//   level2NotifiedAt: 2024-04-07T14:30:00Z,
// }
```

### Acknowledge Escalation (Stop Further Escalation)

```typescript
// User/Manager acknowledges they're handling it
await escalationService.acknowledge(
  'nc-001',
  'NonConformance',
  'manager@company.com'
);
// Status changes to PAUSED, no more auto-escalations
```

### Pause & Resume

```typescript
// Temporarily stop escalation
await escalationService.pauseEscalation('ca-001', 'CorrectiveAction');

// Resume later
await escalationService.resumeEscalation('ca-001', 'CorrectiveAction');
```

### Get Applicable SLA Rule

```typescript
import { SLAService } from '@/modules/escalation';

const slaService = new SLAService(prisma);

// Get rule for HIGH severity in Production department
const rule = await slaService.getApplicableRule(
  'HIGH',
  'dept-production'
);

console.log(rule);
// {
//   level1DelayHours: 0,      // Immediate
//   level2DelayHours: 8,      // 8 hours (production-specific)
//   level3DelayHours: 24,
//   notifyChannels: ['EMAIL', 'IN_APP', 'WEBSOCKET'],
// }
```

### Manual Escalation Trigger

```typescript
const escalationService = new EscalationService(prisma);

const state = await escalationService.escalate({
  entityId: 'nc-001',
  entityType: 'NonConformance',
  dueDate: new Date(),
  severity: 'HIGH',
  status: 'OPEN',
  assignedToId: 'user-123',
});

console.log(state.currentLevel); // LEVEL_1, LEVEL_2, or LEVEL_3
```

---

## Configuration

### SLA Rules (Database-Driven)

**Create custom rule via API/Admin:**
```typescript
POST /api/sla-rules
{
  "name": "MEDIUM_MARKETING_DEPT",
  "severity": "MEDIUM",
  "departmentId": "dept-marketing",
  "level1DelayHours": 24,    // 1 day
  "level2DelayHours": 96,    // 4 days
  "level3DelayHours": 192,   // 8 days
  "notifyChannels": ["EMAIL", "IN_APP"],
  "isActive": true
}
```

**Query existing rules:**
```typescript
GET /api/sla-rules?severity=HIGH&department=dept-production
```

### Notification Channels

**Configure channels in environment:**
```bash
# .env
SENDGRID_API_KEY=sg_xxxxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

**Register WebSocket connection (per user session):**
```typescript
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  notificationService.registerWebSocketConnection(userId, socket);
});
```

---

## Monitoring & Debugging

### View Escalation History

```typescript
// Get all escalation events for an item
const history = await prisma.escalationHistory.findMany({
  where: { ncEscalationId: 'escal-001' },
  orderBy: { createdAt: 'desc' },
});

history.forEach(event => {
  console.log(`${event.createdAt} - ${event.eventType}: ${event.reason}`);
});
```

### Check Notification Status

```typescript
const notification = await prisma.notification.findUnique({
  where: { id: 'notif-123' },
});

console.log(notification);
// {
//   status: 'SENT',
//   channels: ['EMAIL', 'IN_APP'],
//   channelStatuses: { EMAIL: 'SENT', IN_APP: 'FAILED' },
//   retryCount: 1,
//   sentAt: 2024-04-07T14:30:00Z,
// }
```

### Run Escalation Worker Manually

```typescript
// POST /api/escalation/run-once
const worker = new EscalationWorker(prisma);
const batch = await worker.runOnce();

console.log(`
✅ Batch Complete:
  - Total Items: ${batch.items.length}
  - Processed: ${batch.processedCount}
  - Failed: ${batch.failedCount}
  - Errors: ${batch.errors.length}
`);
```

### Debug Query Performance

```typescript
// Measure overdue detection
const start = Date.now();
const overdueItems = await escalationService.detectOverdueItems();
console.log(`Detected ${overdueItems.length} items in ${Date.now() - start}ms`);

// Should be <100ms with proper indexing
```

---

## Common Patterns

### Escalate Only HIGH/CRITICAL

```typescript
const overdueItems = await escalationService.detectOverdueItems();

const criticalItems = overdueItems.filter(item =>
  ['HIGH', 'CRITICAL'].includes(item.severity)
);

for (const item of criticalItems) {
  await escalationService.escalate({...});
}
```

### Exclude Specific Departments

```typescript
const rule = await slaService.getApplicableRule(
  'HIGH',
  departmentId === 'dept-executive' ? null : departmentId
);
// null department ID gets global rule
```

### Custom Notification Recipients

```typescript
// Override default recipients
const rule = await slaService.getApplicableRule('HIGH');
rule.level2Recipients = ['cto@company.com', 'vp-ops@company.com'];

const recipients = slaService.getRecipientsForLevel(
  rule,
  EscalationLevel.LEVEL_2
);
```

---

## Troubleshooting

### Escalations Not Triggering

```typescript
// Check 1: Is worker running?
console.log(worker.isRunning);

// Check 2: Are there overdue items?
const items = await escalationService.detectOverdueItems();
console.log(`Overdue items: ${items.length}`);

// Check 3: Is escalation paused?
const state = await escalationService.getState(entityId, entityType);
console.log(`Escalation Status: ${state.escalationStatus}`);

// Check 4: Check SLA rule
const rule = await slaService.getApplicableRule(severity);
console.log(`Rule: ${JSON.stringify(rule)}`);

// Check 5: Manually trigger
const batch = await worker.runOnce();
console.log(batch.errors);
```

### Notifications Not Sending

```typescript
// Check notification status
const notif = await prisma.notification.findUnique({
  where: { id: notifId },
});

console.log(notif.status);              // SENT, FAILED, RETRYING
console.log(notif.channelStatuses);     // JSON of per-channel status
console.log(notif.failureReason);       // Error details

// Retry manually
await notificationService.retry(notifId);
```

### Duplicate Notifications

```typescript
// Check idempotency key
const dupNotif = await prisma.notification.findUnique({
  where: { idempotencyKey: key },
});

if (dupNotif) {
  console.log('✅ Duplicate prevented, using existing:', dupNotif.id);
}
```

---

## API Endpoints (Example)

```typescript
// GET /api/escalations - List all escalations
GET /api/escalations?severity=HIGH&status=ACTIVE

// GET /api/escalations/:entityId/:entityType - Get one
GET /api/escalations/nc-001/NonConformance

// POST /api/escalations/:entityId/:entityType/acknowledge - Acknowledge
POST /api/escalations/nc-001/NonConformance/acknowledge
{ "acknowledgedBy": "manager@company.com" }

// POST /api/escalations/:entityId/:entityType/pause - Pause
POST /api/escalations/nc-001/NonConformance/pause

// POST /api/escalations/:entityId/:entityType/resume - Resume
POST /api/escalations/nc-001/NonConformance/resume

// POST /api/escalation/trigger - Run worker once
POST /api/escalation/trigger

// GET /api/escalations/:entityId/:entityType/history - Audit trail
GET /api/escalations/nc-001/NonConformance/history

// GET /api/notifications/:notificationId - Check status
GET /api/notifications/notif-123

// POST /api/notifications/:notificationId/retry - Retry
POST /api/notifications/notif-123/retry
```

---

## Next Steps

1. **Test with scenarios** - Run `escalation.examples.ts` to see all patterns
2. **Set up monitoring** - Track escalations per hour, response times
3. **Configure channels** - Add email, SMS, Slack integrations
4. **Train team** - Show how to acknowledge/pause escalations
5. **Monitor metrics** - Dashboard showing escalation trends

For complete documentation, see `ESCALATION_SYSTEM.md` 📖

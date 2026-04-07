# 📂 Escalation System - Complete File Structure

## All Deliverables

```
QMS-Backend/
├── 📄 ESCALATION_README.md                  ← START HERE (Overview)
├── 📄 ESCALATION_QUICK_START.md            ← Setup & Usage Guide
├── 📄 ESCALATION_SYSTEM.md                 ← Complete Architecture
├── 📄 ESCALATION_IMPLEMENTATION.md         ← Integration Checklist
├── 📄 ESCALATION_FILE_TREE.md              ← This file
│
└── src/modules/escalation/                 ← Main Implementation
    ├── index.ts                            (21 lines)
    │   └─ Module exports (all services)
    │
    ├── escalation.types.ts                 (169 lines)
    │   └─ Type definitions & interfaces
    │      ├─ EscalationLevel, EscalationStatus
    │      ├─ NotificationChannel, NotificationStatus
    │      ├─ EscalationContext, EscalationState
    │      ├─ NotificationPayload, ChannelNotification
    │      ├─ EscalationEvent, EscalationEventType
    │      ├─ OverdueItem, StopCondition
    │      └─ Service interfaces (IEscalationService, ISLAService, etc.)
    │
    ├── sla.service.ts                      (202 lines)
    │   └─ SLA Rules Engine
    │      ├─ getApplicableRule() - with fallback hierarchy
    │      ├─ getNextEscalationTime()
    │      ├─ shouldEscalate()
    │      ├─ getNextLevel()
    │      ├─ getRecipientsForLevel()
    │      └─ Default rules for each severity
    │
    ├── escalation.service.ts               (361 lines)
    │   └─ Core Escalation Logic
    │      ├─ detectOverdueItems() - batch query
    │      ├─ escalate() - state transition
    │      ├─ acknowledge() - stop escalation
    │      ├─ pauseEscalation() / resumeEscalation()
    │      ├─ getState()
    │      ├─ Stop condition checking
    │      └─ Audit event recording
    │
    ├── notification.service.ts             (358 lines)
    │   └─ Multi-Channel Notifications
    │      ├─ Channel handlers:
    │      │  ├─ EmailChannelHandler (SendGrid/AWS SES)
    │      │  ├─ InAppChannelHandler (database alerts)
    │      │  ├─ WebSocketChannelHandler (real-time)
    │      │  ├─ SMSChannelHandler (Twilio/AWS SNS)
    │      │  └─ SlackChannelHandler (webhooks)
    │      ├─ send() - idempotent notification delivery
    │      ├─ retry() - exponential backoff
    │      ├─ getStatus()
    │      ├─ registerWebSocketConnection()
    │      └─ generateIdempotencyKey()
    │
    ├── escalation.worker.ts                (246 lines)
    │   └─ Background Job Orchestrator
    │      ├─ runOnce() - single execution cycle
    │      ├─ start() - continuous processing
    │      ├─ stop()
    │      ├─ retryFailedNotifications()
    │      └─ setupEscalationWorker() helper
    │
    ├── sla.config.ts                       (231 lines)
    │   └─ SLA Rules Configuration
    │      ├─ seedSLARules() - database seeding
    │      ├─ PRODUCTION_DEPT_SLA example
    │      ├─ QUALITY_DEPT_SLA example
    │      ├─ SLA_CONFIG_EXAMPLE (JSON format)
    │      └─ DEFAULT_SLA_RULES
    │
    ├── escalation.examples.ts              (418 lines)
    │   └─ Real-World Scenarios (6 total)
    │      ├─ scenario1_CriticalNC() - immediate escalation
    │      ├─ scenario2_HighCAWithDeptSLA() - dept override
    │      ├─ scenario3_AcknowledgmentStopsEscalation()
    │      ├─ scenario4_ResolutionStopsEscalation()
    │      ├─ scenario5_BatchProcessing()
    │      ├─ scenario6_IdempotencyPrevention()
    │      └─ runAllScenarios() - run all at once
    │
    └── escalation.api.ts                   (463 lines)
        └─ REST & GraphQL Integration
           ├─ REST Endpoints:
           │  ├─ GET    /api/escalations
           │  ├─ GET    /api/escalations/:type/:id
           │  ├─ POST   /api/escalations/:type/:id/acknowledge
           │  ├─ POST   /api/escalations/:type/:id/pause
           │  ├─ POST   /api/escalations/:type/:id/resume
           │  ├─ GET    /api/escalations/:type/:id/history
           │  ├─ GET    /api/sla-rules
           │  ├─ POST   /api/sla-rules
           │  ├─ PUT    /api/sla-rules/:id
           │  ├─ POST   /api/escalation/trigger
           │  ├─ GET    /api/notifications/:id
           │  └─ POST   /api/notifications/:id/retry
           │
           ├─ GraphQL Queries:
           │  ├─ escalationState()
           │  ├─ escalations()
           │  ├─ slaRule()
           │  └─ escalationHistory()
           │
           ├─ GraphQL Mutations:
           │  ├─ acknowledgeEscalation()
           │  ├─ pauseEscalation()
           │  ├─ resumeEscalation()
           │  ├─ createSLARule()
           │  └─ triggerEscalation()
           │
           └─ WebSocket Integration:
              └─ registerEscalationSocket()
```

## Database Schema Updates

```sql
-- New Enums
enum EscalationLevel { NONE, LEVEL_1, LEVEL_2, LEVEL_3 }
enum EscalationStatus { NONE, ACTIVE, RESOLVED, PAUSED }
enum NotificationChannel { EMAIL, IN_APP, WEBSOCKET, SMS, SLACK }
enum NotificationStatus { PENDING, SENT, FAILED, RETRYING }

-- New Tables
SLARule
├─ id (String, PK)
├─ name (String, UNIQUE)
├─ description (String)
├─ severity (Severity)
├─ departmentId (String, FK, nullable)
├─ level1/2/3DelayHours (Int)
├─ level1/2/3Recipients (String[])
├─ notifyChannels (NotificationChannel[])
├─ isActive (Boolean)
└─ timestamps (createdAt, updatedAt)

NonConformanceEscalation
├─ id (String, PK)
├─ nonConformanceId (String, FK, UNIQUE)
├─ currentLevel (EscalationLevel)
├─ escalationStatus (EscalationStatus)
├─ isOverdue (Boolean)
├─ overdueAt (DateTime)
├─ lastEscalatedAt (DateTime)
├─ nextEscalationAt (DateTime)
├─ level1/2/3NotifiedAt (DateTime)
├─ acknowledgedAt (DateTime)
├─ acknowledgedBy (String)
├─ appliedSLARuleId (String, FK)
├─ escalationHistory (Relation[])
└─ timestamps

CorrectiveActionEscalation
├─ (Same structure as NonConformanceEscalation)
└─ For CorrectiveAction entities

EscalationHistory (Audit Trail)
├─ id (String, PK)
├─ ncEscalationId (String, FK, nullable)
├─ caEscalationId (String, FK, nullable)
├─ eventType (String)
├─ escalationLevel (EscalationLevel)
├─ reason (String)
├─ triggeredBy (String)
├─ notificationsId (String[])
└─ createdAt (DateTime)

Notification (Delivery Tracking)
├─ id (String, PK)
├─ entityType (String)
├─ entityId (String)
├─ escalationLevel (EscalationLevel)
├─ recipientEmail (String)
├─ recipientUserId (String)
├─ channels (NotificationChannel[])
├─ channelStatuses (String, JSON)
├─ status (NotificationStatus)
├─ retryCount (Int)
├─ maxRetries (Int)
├─ lastRetryAt (DateTime)
├─ nextRetryAt (DateTime)
├─ failureReason (String)
├─ idempotencyKey (String, UNIQUE)
├─ sentAt (DateTime)
└─ timestamps
```

## Documentation Files

```
ESCALATION_README.md              (530+ lines)
├─ Feature overview
├─ 5-minute setup
├─ Quick facts & highlights
└─ API reference

ESCALATION_SYSTEM.md              (650+ lines)
├─ High-level architecture
├─ Data flow diagrams (textual)
├─ Database schema explanation
├─ Service architecture details
├─ Real-world scenarios (4 detailed)
├─ Edge cases & solutions
├─ Performance optimization
├─ Integration checklist
├─ Bonus: Future enhancements
└─ Complete summary

ESCALATION_QUICK_START.md         (310+ lines)
├─ 5-minute setup guide
├─ Database migration
├─ SLA rule seeding
├─ Worker initialization
├─ Service integration
├─ Usage examples (6 code samples)
├─ Configuration guide
├─ Monitoring & debugging
├─ Common patterns
├─ Troubleshooting guide
└─ API endpoints

ESCALATION_IMPLEMENTATION.md      (330+ lines)
├─ Complete checklist
├─ Deliverables summary
├─ Features implemented
├─ Architecture highlights
├─ Real-world scenarios (6 detailed)
├─ Edge cases covered
├─ Performance metrics
├─ Scaling approach
├─ Integration checklist
└─ Success criteria

ESCALATION_FILE_TREE.md           (This file)
└─ Complete directory structure
```

## Statistics

| Category | Count | Details |
|----------|-------|---------|
| TypeScript Files | 8 | Core implementation modules |
| Lines of Code (TS) | 2,200+ | Production-ready code |
| Documentation Files | 5 | Comprehensive guides |
| Lines of Documentation | 1,820+ | Architecture, setup, integration |
| Real-World Scenarios | 6 | Runnable examples |
| REST Endpoints | 12 | Full CRUD + actions |
| GraphQL Queries | 4 | Complex data retrieval |
| GraphQL Mutations | 5 | State-changing operations |
| Database Tables | 5 | Core + audit + notifications |
| Indexes | 5+ | Performance optimization |
| Notification Channels | 5 | Email, SMS, In-app, WebSocket, Slack |
| Escalation Levels | 3 | LEVEL_1, LEVEL_2, LEVEL_3 |
| SLA Severities | 4 | LOW, MEDIUM, HIGH, CRITICAL |


## Getting Started

1. **Read documentation** (in order):
   - ESCALATION_README.md (overview)
   - ESCALATION_QUICK_START.md (setup)
   - ESCALATION_SYSTEM.md (deep dive)

2. **Run setup**:
   ```bash
   npx prisma migrate dev --name add_escalation_system
   ```

3. **Test with scenarios**:
   ```typescript
   import { runAllScenarios } from '@/modules/escalation';
   await runAllScenarios();
   ```

4. **Integrate with services**:
   - See ESCALATION_QUICK_START.md section "Integrate with Services"

5. **Deploy**:
   - See ESCALATION_IMPLEMENTATION.md section "Integration Checklist"


## Key Files by Purpose

| Purpose | Files |
|---------|-------|
| **Types & Interfaces** | escalation.types.ts |
| **Business Logic** | escalation.service.ts, sla.service.ts |
| **Notifications** | notification.service.ts |
| **Background Jobs** | escalation.worker.ts |
| **API Layer** | escalation.api.ts |
| **Configuration** | sla.config.ts |
| **Examples** | escalation.examples.ts |
| **Setup** | ESCALATION_QUICK_START.md |
| **Architecture** | ESCALATION_SYSTEM.md |
| **Integration** | ESCALATION_IMPLEMENTATION.md |


---

**Total Implementation: 2,200+ lines of TypeScript + 1,820+ lines of documentation**

🚀 **Production-ready and fully documented**

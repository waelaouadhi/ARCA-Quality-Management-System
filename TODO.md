# QMS Backend - TODO & Enhancement Roadmap

> **Last Updated:** 2026-04-06  
> **Current State:** Production-ready QMS backend with solid foundations

## 📊 Project Metrics

- **Source Files:** 54 TypeScript files
- **Test Files:** 9 test suites
- **Core Modules:** 5 (auth, user, document, nonConformance, correctiveAction)
- **Test Coverage:** 91% (80 passing tests)
- **Architecture:** Clean 3-layer (Resolver → Service → Repository)
- **Tech Stack:** PostgreSQL + Prisma ORM, GraphQL API
- **Features:** Auth/RBAC, seed data, migrations

---

## 🎯 Enhancement Recommendations (Prioritized)

### **HIGH PRIORITY** ⚡

#### 1. Input Validation with Zod
**Status:** 🔴 Not Started  
**Priority:** HIGH  
**Effort:** 2-3 days  
**Impact:** Prevent invalid data, better error messages

**Description:**  
GraphQL schema types don't validate runtime business rules. Need service-level validation.

**Implementation:**
```typescript
// Install: npm install zod
// Create schemas in each service:

const CreateDocumentSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().max(50000).optional(),
  type: z.enum(['POLICY', 'PROCEDURE', 'FORM', 'RECORD']),
});

// Use in service:
const validated = CreateDocumentSchema.parse(input);
```

**Files to update:**
- `src/modules/auth/auth.service.ts`
- `src/modules/user/user.service.ts`
- `src/modules/document/document.service.ts`
- `src/modules/nonConformance/nonConformance.service.ts`
- `src/modules/correctiveAction/correctiveAction.service.ts`

---

#### 2. Centralized Audit Logging
**Status:** 🔴 Not Started  
**Priority:** HIGH  
**Effort:** 1-2 days  
**Impact:** Compliance, traceability, debugging

**Description:**  
Currently audit logging is manual per operation and inconsistent.

**Implementation:**
```typescript
// Create: src/modules/audit/audit.service.ts

class AuditService {
  async log(params: {
    userId: string;
    action: string; // 'CREATE', 'UPDATE', 'DELETE', 'CLOSE'
    entity: string; // 'Document', 'NonConformance', etc.
    entityId: string;
    before?: any;
    after?: any;
    reason?: string;
  }) {
    // Automatically log all mutations
  }
}

// Integrate into all service methods
```

**Files to create:**
- `src/modules/audit/audit.service.ts`
- `src/modules/audit/audit.repository.ts`

**Files to update:**
- All service files to call audit.log()

---

#### 3. Transaction-Safe Workflows
**Status:** 🔴 Not Started  
**Priority:** HIGH  
**Effort:** 1 day  
**Impact:** Data integrity, reliability

**Description:**  
Multi-step operations can leave inconsistent state if one step fails.

**Implementation:**
```typescript
// Wrap multi-step operations in transactions:

async createNonConformanceWithAction(input, currentUser) {
  return await prisma.$transaction(async (tx) => {
    const nc = await NonConformanceRepository.create(input, tx);
    
    if (input.correctiveAction) {
      await CorrectiveActionRepository.create({
        nonConformanceId: nc.id,
        ...input.correctiveAction
      }, tx);
    }
    
    await AuditService.log({ ... }, tx);
    
    return nc;
  });
}
```

**Use cases:**
- Creating NC + CorrectiveAction together
- Deleting document + cascading relations
- Closing NC + updating related actions
- User deletion + audit log

---

#### 4. Repository Integration Tests
**Status:** 🔴 Not Started  
**Priority:** HIGH  
**Effort:** 2-3 days  
**Impact:** Catch Prisma-specific bugs, safer deployments

**Description:**  
Service tests mock repositories and never validate real Prisma behavior.

**Implementation:**
```typescript
// Create: src/__tests__/integration/
//   ├── document.repository.test.ts
//   ├── nonConformance.repository.test.ts
//   └── correctiveAction.repository.test.ts

// Test against real test database:
describe('DocumentRepository Integration', () => {
  beforeEach(async () => {
    // Setup test database
  });
  
  it('should handle relationship loading', async () => {
    // Test Prisma includes
  });
  
  it('should rollback on constraint violation', async () => {
    // Test database constraints
  });
});
```

**Setup needed:**
- Test database configuration
- Database reset between tests
- Transaction rollback support

---

#### 5. CI/CD Pipeline
**Status:** 🔴 Not Started  
**Priority:** HIGH  
**Effort:** 1 day  
**Impact:** Prevent bad code from reaching production

**Description:**  
No automated quality gates before deployment.

**Implementation:**
```yaml
# Create: .github/workflows/ci.yml

name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test:coverage
      - run: npx prisma migrate diff
```

**Checks:**
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Tests + coverage threshold
- ✅ Build successful
- ✅ Migration validation
- ✅ Security audit (npm audit)

---

### **MEDIUM PRIORITY** 🔧

#### 6. API Rate Limiting
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 1 day  
**Impact:** Service stability, cost control

**Implementation:**
```typescript
// Install: npm install express-rate-limit graphql-rate-limit

// Apply per-user, per-IP, or per-resolver
const rateLimiter = new GraphQLRateLimiter({
  identifyContext: (ctx) => ctx.user?.id || ctx.ip,
  maxPerWindow: 1000,
  windowMs: 60000, // 1 minute
});
```

---

#### 7. Request ID Tracing
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 0.5 days  
**Impact:** Debugging, observability

**Implementation:**
```typescript
// Add to GraphQL context:
context: ({ req }) => ({
  requestId: req.headers['x-request-id'] || uuidv4(),
  user: req.user,
});

// Add to all logs:
logger.info('Creating document', { 
  requestId: context.requestId,
  userId: context.user.id 
});
```

**Files to update:**
- `src/index.ts` - Add request ID middleware
- All service files - Add requestId to logs
- `src/shared/logger.ts` - Include requestId in log format

---

#### 8. GraphQL Query Complexity Limits
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 1 day  
**Impact:** Performance, DoS prevention

**Implementation:**
```typescript
// Install: npm install graphql-query-complexity

// Limit query depth, breadth, complexity
const complexityLimitPlugin = {
  requestDidStart: () => ({
    didResolveOperation({ request, document }) {
      const complexity = getComplexity({
        schema,
        query: document,
        variables: request.variables,
        estimators: [
          simpleEstimator({ defaultComplexity: 1 }),
        ],
      });
      
      if (complexity > 1000) {
        throw new ValidationError('Query too complex');
      }
    },
  }),
};
```

---

#### 9. Pagination Enforcement
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 1 day  
**Impact:** Performance, scalability

**Implementation:**
```typescript
// Update all list queries:
interface PaginationArgs {
  limit?: number; // max 100
  offset?: number;
  cursor?: string; // for cursor-based
}

// Enforce in services:
const limit = Math.min(args.limit || 20, 100);
const items = await repository.findMany({
  take: limit,
  skip: args.offset,
});
```

**Queries to update:**
- `users()`
- `documents()`
- `nonConformances()`
- `correctiveActions()`
- `auditLogs()`

---

#### 10. Error Code Standardization
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 1 day  
**Impact:** Better client error handling

**Implementation:**
```typescript
// Create: src/shared/error-codes.ts

export enum ErrorCode {
  // Auth errors
  AUTH_001 = 'INVALID_CREDENTIALS',
  AUTH_002 = 'TOKEN_EXPIRED',
  AUTH_003 = 'UNAUTHORIZED',
  
  // Document errors
  DOC_001 = 'DOCUMENT_NOT_FOUND',
  DOC_002 = 'DOCUMENT_ALREADY_ARCHIVED',
  
  // Validation errors
  VAL_001 = 'INVALID_INPUT',
  VAL_002 = 'VALIDATION_FAILED',
}

// Use in errors:
throw new NotFoundError('Document not found', ErrorCode.DOC_001);
```

---

### **NICE TO HAVE** 💡

#### 11. GraphQL Subscriptions
**Status:** 🔴 Not Started  
**Priority:** LOW  
**Effort:** 3-4 days  
**Impact:** Better UX, real-time collaboration

**Use cases:**
- Subscribe to new non-conformances
- Real-time corrective action updates
- Document approval workflow notifications

**Implementation:**
```typescript
// Install: npm install graphql-subscriptions

type Subscription = {
  nonConformanceCreated: NonConformance;
  correctiveActionUpdated: CorrectiveAction;
  documentStatusChanged: Document;
};
```

---

#### 12. File Upload Support
**Status:** 🔴 Not Started  
**Priority:** LOW  
**Effort:** 3-5 days  
**Impact:** Core feature for document management

**Features needed:**
- Multipart upload handler
- S3/MinIO storage integration
- File virus scanning
- Image preview generation
- File size limits
- Allowed file types

**Implementation:**
```typescript
// Install: npm install graphql-upload @aws-sdk/client-s3

type Mutation = {
  uploadDocumentAttachment(
    documentId: ID!
    file: Upload!
  ): Attachment!
};
```

---

#### 13. Email Notifications
**Status:** 🔴 Not Started  
**Priority:** LOW  
**Effort:** 2-3 days  
**Impact:** User engagement, workflow efficiency

**Templates needed:**
- Corrective action assigned
- Document needs review
- Non-conformance escalation
- User registration confirmation
- Password reset

**Implementation:**
```typescript
// Install: npm install nodemailer

class EmailService {
  async sendCorrectiveActionAssigned(params: {
    to: string;
    actionId: string;
    assignedBy: string;
  }) {
    // Send email via SMTP/SendGrid/SES
  }
}
```

---

#### 14. Advanced Search (Full-Text)
**Status:** 🔴 Not Started  
**Priority:** LOW  
**Effort:** 4-5 days  
**Impact:** Usability at scale

**Features:**
- Full-text search in document content
- Non-conformance description search
- Fuzzy matching
- Search highlighting
- Filters + search combination

**Implementation:**
```typescript
// Option 1: PostgreSQL full-text search
// Option 2: Elasticsearch integration

type Query = {
  searchDocuments(
    query: string
    filters: DocumentFilters
  ): [Document!]!
};
```

---

#### 15. Performance Monitoring
**Status:** 🔴 Not Started  
**Priority:** LOW  
**Effort:** 2 days  
**Impact:** Proactive performance management

**Metrics to track:**
- GraphQL operation duration
- Database query performance
- Error rate by operation
- Request throughput
- Memory/CPU usage

**Implementation:**
```typescript
// Install: npm install @sentry/node dd-trace

// Integrate APM:
// - Datadog
// - New Relic
// - Sentry
```

---

## 🔒 Security Enhancements

#### 16. Refresh Token Implementation
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 1-2 days

**Current issue:** JWT tokens don't expire properly, no revocation mechanism.

**Implementation:**
- Store refresh tokens in database
- Short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days)
- Token rotation on refresh
- Revocation support

---

#### 17. Password Policy Enforcement
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 1 day

**Requirements:**
- Minimum 12 characters
- Complexity requirements (upper, lower, number, special)
- Password history (prevent reuse of last 5)
- Breach checking (HaveIBeenPwned API)

---

#### 18. SQL Injection Protection Audit
**Status:** 🔴 Not Started  
**Priority:** HIGH  
**Effort:** 0.5 days

**Task:** Verify all Prisma queries use parameterization, no raw SQL with string interpolation.

---

#### 19. Security Headers (Helmet.js)
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 0.5 days

**Headers to add:**
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

```typescript
// Install: npm install helmet
app.use(helmet());
```

---

## 📈 Scalability & Performance

#### 20. Database Connection Pooling
**Status:** 🟡 Review Needed  
**Priority:** MEDIUM  
**Effort:** 0.5 days

**Task:** Review and optimize Prisma connection pool settings for production load.

```typescript
// prisma.config.ts
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_size = 20 // Review this
  connection_limit = 30
}
```

---

#### 21. Caching Layer (Redis)
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 2-3 days

**Cache candidates:**
- User sessions
- Document metadata (frequently accessed)
- Non-conformance lists
- GraphQL query results (short TTL)

**Implementation:**
```typescript
// Install: npm install ioredis

class CacheService {
  async get(key: string): Promise<any>;
  async set(key: string, value: any, ttl: number): Promise<void>;
  async invalidate(pattern: string): Promise<void>;
}
```

---

#### 22. Database Indexing Review
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 1 day

**Task:** Analyze slow queries and add missing indexes.

**Candidates:**
- `Document.status` + `Document.createdAt` (for filtering/sorting)
- `NonConformance.status` + `NonConformance.severity`
- `CorrectiveAction.assignedTo` + `CorrectiveAction.status`
- `AuditLog.userId` + `AuditLog.createdAt`

---

## 📚 Documentation & DevEx

#### 23. API Documentation
**Status:** 🔴 Not Started  
**Priority:** MEDIUM  
**Effort:** 1-2 days

**Deliverables:**
- GraphQL Playground with examples
- API usage guide
- Authentication flow documentation
- Error handling guide

---

#### 24. Deployment Runbook
**Status:** 🔴 Not Started  
**Priority:** HIGH  
**Effort:** 1 day

**Contents:**
- Production deployment steps
- Environment variable checklist
- Database migration process
- Rollback procedure
- Incident response guide
- Monitoring setup

---

#### 25. Database Migration Strategy
**Status:** 🔴 Not Started  
**Priority:** HIGH  
**Effort:** 0.5 days

**Document:**
- Forward migration process
- Rollback strategy
- Zero-downtime deployment pattern
- Data migration best practices

---

## 💎 Quick Wins (Do This Week)

| Task | Status | Effort | Impact |
|------|--------|--------|--------|
| Add `.nvmrc` file | 🔴 | 5 min | Consistent Node version |
| Add health check metadata | 🔴 | 15 min | Better monitoring |
| Add `npm run validate` script | 🔴 | 10 min | Pre-commit checks |
| Document env vars in README | 🔴 | 30 min | Easier setup |
| Add Dependabot config | 🔴 | 15 min | Auto dependency updates |
| Add `.dockerignore` file | 🔴 | 10 min | Smaller Docker images |
| Add `CHANGELOG.md` | 🔴 | 20 min | Track changes |

---

## 🎯 Recommended Roadmap

### **Sprint 1 (Week 1-2): Critical Foundations**
- [ ] Input validation (Zod)
- [ ] Audit logging service
- [ ] Transaction-safe workflows
- [ ] CI/CD pipeline
- [ ] Quick wins

**Outcome:** Production-hardened core

---

### **Sprint 2 (Week 3-4): Security & Testing**
- [ ] Repository integration tests
- [ ] Refresh token implementation
- [ ] Rate limiting
- [ ] Security headers
- [ ] Password policy enforcement
- [ ] SQL injection audit

**Outcome:** Security-compliant system

---

### **Sprint 3 (Week 5-6): Performance & Observability**
- [ ] Request ID tracing
- [ ] GraphQL query complexity limits
- [ ] Caching layer (Redis)
- [ ] Performance monitoring
- [ ] Database indexing review
- [ ] Connection pooling optimization

**Outcome:** Production-ready performance

---

### **Sprint 4 (Week 7-8): Features**
- [ ] File upload support
- [ ] Email notifications
- [ ] GraphQL subscriptions
- [ ] Advanced search (full-text)
- [ ] Pagination enforcement
- [ ] Error code standardization

**Outcome:** Feature-complete platform

---

## 📊 Success Metrics

**Quality Gates:**
- ✅ 90%+ test coverage maintained
- ✅ All CI checks passing
- ✅ Zero critical security vulnerabilities
- ✅ API response time < 200ms (p95)
- ✅ Zero data loss incidents

**Completion Criteria:**
- [ ] All HIGH priority items complete
- [ ] CI/CD pipeline operational
- [ ] Security audit passed
- [ ] Performance baseline established
- [ ] Production runbook documented

---

## 🏁 Current Architecture Status

**✅ Strengths:**
- Clean 3-layer architecture (Resolver → Service → Repository)
- Strong separation of concerns
- Comprehensive test coverage (91%)
- Type-safe codebase
- Working auth/RBAC
- Database migrations

**⚠️ Gaps:**
- No input validation framework
- Manual audit logging
- No transaction guarantees
- Missing CI/CD
- No production monitoring
- Limited security hardening

**Bottom Line:** Solid foundation. Focus on validation, auditing, testing, and CI/CD first — these give the best ROI.

---

**Status Legend:**
- 🔴 Not Started
- 🟡 In Progress / Review Needed
- 🟢 Complete

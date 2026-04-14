# QMS Backend - Enhancement Roadmap (2026)

> **Last Updated:** April 8, 2026  
> **Priority**: CRITICAL → MEDIUM → LOW

---

## CRITICAL 🔴 - Must Fix Immediately

### 1. User ID Validation Mismatch
- **Issue**: `user.validation.ts:38` uses `z.string().uuid()` but Prisma uses cuid() format
- **Impact**: `user(id: ID!)` query fails with "Invalid user ID format"
- **Files**: `src/modules/user/user.validation.ts`
- **Fix**: Change to `z.string().cuid()` or create custom cuid validator
- **Effort**: 15 minutes

```typescript
// Current (broken):
export const UserIdSchema = z.string().uuid('Invalid user ID format');

// Fixed:
export const UserIdSchema = z.string().cuid('Invalid user ID format');
```

---

### 2. Production Build Path Resolution
- **Issue**: `npm start` fails - `@/` path aliases not resolved at runtime
- **Error**: `Cannot find module '@/modules/auth'`
- **Files**: `package.json`, `tsconfig.json`
- **Fix**: Add tsconfig-paths to start script
- **Effort**: 10 minutes

```json
// package.json - update scripts:
{
  "scripts": {
    "start": "node -r tsconfig-paths/register dist/index.js",
    "dev": "nodemon"
  }
}
```

---

### 3. Environment Variables Incomplete
- **Issue**: Only DATABASE_URL set, missing JWT_SECRET (security risk), NODE_ENV, etc.
- **Impact**: Using default insecure JWT_SECRET in production
- **Files**: `.env`
- **Fix**: Copy `.env.example` to `.env` and configure all variables
- **Effort**: 10 minutes

```bash
# .env - must configure:
NODE_ENV=production
PORT=4000
JWT_SECRET=<generate-strong-random-256-bit-key>
JWT_EXPIRES_IN=15m
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=warn
```

---

### 4. TypeScript Compilation Errors (31 errors)
- **Issue**: JSDoc comment with cron pattern `*/5 * * * *` causes parser errors
- **Files**: `src/modules/escalation/escalation.worker.ts` lines 259-263
- **Fix**: Escape with backticks or remove from JSDoc
- **Effort**: 15 minutes

```typescript
// Current (broken in JSDoc):
/**
 * repeat: {
 *   pattern: '*/5 * * * *',  // Every 5 minutes
 * }
 */

// Fixed:
/**
 * repeat: {
 *   pattern: \`*/5 * * * *\`,  // Every 5 minutes
 * }
 */
// OR just remove the comment:
/**
 * Example cron schedule configuration (see BullMQ docs)
 */
```

---

### 5. Branch Coverage Below Threshold
- **Issue**: 68.85% vs 70% target - fails CI/CD gate
- **Gap**: 1.15% (mainly in correctiveAction.service.ts branches)
- **Files**: `jest.config.js`, `src/__tests__/services/`
- **Fix**: Add 3-5 tests for error paths and conditional authorization
- **Effort**: 2 hours

**Priority files to add tests:**
- `correctiveAction.service.ts` - error handling branches (41.66% branches)
- `nonConformance.service.ts` - conditional logic (58.33% branches)

```typescript
// Add test for authorization failure paths:
it('should throw AuthorizationError when USER tries to create', async () => {
  const userPayload = { userId: 'user123', email: 'user@test.com', role: 'USER' };
  await expect(service.createDocument(input, userPayload))
    .rejects.toThrow('Insufficient permissions');
});
```

---

## MEDIUM 🟡 - Should Fix Soon

### 6. Centralized Audit Logging Service
- **Current**: Manual audit logging per operation, inconsistent
- **Target**: Unified audit service with auto-logging via middleware
- **Files**: Create `src/modules/audit/audit.service.ts`, `audit.middleware.ts`
- **Effort**: 1-2 days

```typescript
// src/modules/audit/audit.service.ts
export class AuditService {
  async log(params: {
    userId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CLOSE';
    entity: string;
    entityId: string;
    before?: any;
    after?: any;
    reason?: string;
  }) {
    return prisma.auditLog.create({ data: params });
  }
}

// Auto-log via GraphQL middleware
export const auditMiddleware = async (resolve, parent, args, context, info) => {
  const result = await resolve(parent, args, context, info);
  if (info.operation.operation === 'mutation') {
    await AuditService.log({ /* log mutation */ });
  }
  return result;
};
```

---

### 7. Transaction-Safe Workflows
- **Current**: Multi-step operations can leave inconsistent state on failure
- **Target**: Prisma transactions for critical operations
- **Use cases**: NC + CA creation, document deletion, user deletion
- **Effort**: 1 day

```typescript
// Wrap multi-step operations in transactions:
async createNonConformanceWithAction(input, user) {
  return await prisma.$transaction(async (tx) => {
    const nc = await ncRepo.create(input, tx);
    
    if (input.correctiveAction) {
      await caRepo.create({
        nonConformanceId: nc.id,
        ...input.correctiveAction
      }, tx);
    }
    
    await auditLog.create({ /* log transaction */ }, tx);
    return nc;
  });
}
```

---

### 8. Request ID Tracing
- **Current**: No request correlation for debugging
- **Target**: Add x-request-id header, include in all logs
- **Files**: `src/index.ts`, `src/config/logger.ts`, all service files
- **Effort**: 4 hours

```typescript
// src/index.ts - add request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
});

// Include in all logs:
logger.info('Creating document', { 
  requestId: req.id,
  userId: context.user?.id 
});
```

---

### 9. Error Code Standardization
- **Current**: Generic error messages, hard for clients to handle
- **Target**: Structured error codes with documented responses
- **Files**: `src/shared/errors/`
- **Effort**: 1 day

```typescript
// src/shared/errors/codes.ts
export enum ErrorCode {
  // Auth errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_TOKEN_INVALID = 'AUTH_003',
  
  // Document errors
  DOC_NOT_FOUND = 'DOC_001',
  DOC_ALREADY_ARCHIVED = 'DOC_002',
  DOC_NO_PERMISSION = 'DOC_003',
  
  // Validation errors
  VAL_INVALID_INPUT = 'VAL_001',
  VAL_REQUIRED_FIELD = 'VAL_002',
}

// Use in errors:
throw new NotFoundError('Document not found', ErrorCode.DOC_NOT_FOUND);
```

---

### 10. GraphQL Query Complexity Limits
- **Current**: No protection against DoS via complex queries
- **Target**: Limit query depth, breadth, complexity
- **Package**: `graphql-query-complexity`
- **Effort**: 1 day

```bash
npm install graphql-query-complexity
```

```typescript
// src/graphql/index.ts
import { getComplexity, simpleEstimator } from 'graphql-query-complexity';

const complexityPlugin = {
  requestDidStart: () => ({
    didResolveOperation({ request, document }) {
      const complexity = getComplexity({
        schema,
        query: document,
        variables: request.variables,
        estimators: [simpleEstimator({ defaultComplexity: 1 })],
      });
      
      if (complexity > 1000) {
        throw new ValidationError('Query too complex');
      }
    },
  }),
};
```

---

## LOW 🟢 - Future Enhancements

### Features

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 11 | GraphQL Subscriptions (real-time updates) | 3-4 days | High |
| 12 | File Upload with S3/MinIO | 3-5 days | High |
| 13 | Full-text Search (PostgreSQL/Elasticsearch) | 4-5 days | Medium |
| 14 | Email Notifications (nodemailer) | 2-3 days | Medium |
| 15 | SMS Notifications (Twilio) | 1-2 days | Medium |
| 16 | WebSocket for real-time notifications | 2-3 days | High |

### DevOps

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 17 | CI/CD Pipeline (.github/workflows/) | 1 day | High |
| 18 | Docker containerization | 1 day | Medium |
| 19 | Kubernetes deployment configs | 2 days | Medium |
| 20 | Redis caching layer | 2-3 days | High |

### Testing

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 21 | Repository Integration Tests (real Prisma) | 2-3 days | High |
| 22 | E2E Testing with Playwright | 3-4 days | Medium |
| 23 | Property-based testing with fast-check | 2 days | Low |

### Performance

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 24 | Redis caching for user sessions | 1 day | High |
| 25 | Database indexing optimization | 1 day | Medium |
| 26 | Connection pooling review | 0.5 days | Medium |
| 27 | Query result caching | 2 days | High |

### Security

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 28 | Refresh Token Implementation | 1-2 days | High |
| 29 | Password Policy Enforcement | 1 day | Medium |
| 30 | Rate Limiting (per-user/IP) | 1 day | High |
| 31 | Security Headers (Helmet.js) | 0.5 days | Medium |
| 32 | SQL Injection Audit | 0.5 days | High |

---

## Quick Wins (Do This Week)

| Task | Effort | Priority |
|------|--------|----------|
| Add `.nvmrc` for Node version | 5 min | Low |
| Add `npm run validate` script | 10 min | Medium |
| Add Dependabot config | 15 min | Low |
| Document all env vars in README | 30 min | Medium |
| Add `.dockerignore` file | 10 min | Low |

```bash
# .nvmrc
echo "20.10.0" > .nvmrc
```

```json
// package.json add validate script
{
  "scripts": {
    "validate": "npm run lint && npm run build && npm test"
  }
}
```

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## Summary

| Priority | Count | Estimated Time |
|----------|-------|----------------|
| 🔴 Critical | 5 | ~3 hours |
| 🟡 Medium | 5 | ~5-6 days |
| 🟢 Low/Future | 27 | ~3-4 weeks |

---

## Recommended Roadmap

### Sprint 1 (Week 1-2): Critical Fixes
- [x] ~~User ID Validation~~ - TODO: Fix
- [ ] Fix Production Build Path Resolution
- [ ] Complete Environment Variables
- [ ] Fix TypeScript Compilation Errors
- [ ] Fix Branch Coverage Threshold
- [ ] Add Quick Wins

### Sprint 2 (Week 3-4): Foundation
- [ ] Centralized Audit Logging
- [ ] Transaction-Safe Workflows
- [ ] Request ID Tracing
- [ ] Error Code Standardization
- [ ] GraphQL Query Complexity Limits

### Sprint 3 (Week 5-8): Features
- [ ] CI/CD Pipeline
- [ ] Docker containerization
- [ ] Redis caching
- [ ] Refresh tokens
- [ ] Rate limiting

### Sprint 4 (Week 9-12): Advanced
- [ ] GraphQL Subscriptions
- [ ] File Upload
- [ ] Full-text Search
- [ ] Email Notifications
- [ ] E2E Testing

---

**Note**: Critical items (#1-5) should be fixed immediately before any production deployment. The Medium items provide significant stability and maintainability improvements. Low items are future enhancements that can be prioritized based on business needs.

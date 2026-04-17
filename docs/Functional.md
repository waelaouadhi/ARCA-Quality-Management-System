# QMS Backend Analysis for Frontend Integration

## 1. Scope

This document captures **functional** and **non-functional** backend requirements for integrating the QMS frontend.

The analysis is based on the **active runtime path**:

- `src/index.ts` (server bootstrap)
- `src/graphql/index.ts` (GraphQL composition)
- `src/modules/{auth,user,document,nonConformance,correctiveAction}`
- `prisma/schema.prisma` (data model source of truth)

## 2. Active API Surface

| Area | Status | Notes |
|---|---|---|
| REST health check | Active | `GET /health` |
| GraphQL API | Active | `POST /graphql` |
| Auth module | Active | register/login/me |
| User module | Active | list/detail/update/delete |
| Document module | Active | list/detail/create/update/archive |
| Non-Conformance module | Active | list/detail/create/update/close |
| Corrective Action module | Active | list/detail/create/update/complete |
| Escalation module | **Not exposed** | Exists in code/prisma but not wired in `src/graphql/index.ts` or `src/index.ts` |

## 3. Global Integration Contracts

### 3.1 Authentication Contract

- JWT is sent in: `Authorization: Bearer <token>`.
- GraphQL context reads token in `src/index.ts`.
- Missing/invalid token usually results in service-level authorization errors.

### 3.2 Pagination Contract

All list queries return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

Backend defaults:

- `page = 1`
- `limit = 10`

### 3.3 ID Contract

- Database IDs are Prisma `cuid()` (25 lowercase alphanumeric chars).
- Frontend must treat IDs as **opaque** and avoid any UUID assumptions.

### 3.4 Error Contract

GraphQL errors include:

- `message`
- `extensions.statusCode` (mapped from `AppError`)

Important: `extensions.code` is often `INTERNAL_SERVER_ERROR`, so frontend should rely on `statusCode` + `message`.

## 4. Functional Requirements by Module

## 4.1 Auth

### Operations

- `mutation register(input: RegisterInput!): AuthPayload!`
- `mutation login(input: LoginInput!): AuthPayload!`
- `query me: User`

### Required Frontend Behavior

- Registration form: `email`, `password`, `firstName`, `lastName`.
- Login form: `email`, `password`.
- Persist token securely and attach it to every protected GraphQL request.
- On app start, call `me` to restore session state.

## 4.2 Users

### Operations

- `query users(pagination): UserList!`
- `query user(id: ID!): User!`
- `mutation updateUser(id: ID!, input: UpdateUserInput!): User!`
- `mutation deleteUser(id: ID!): Boolean!`

### Current Backend Authorization (as implemented)

- `users`: authenticated user
- `user`: authenticated user
- `updateUser`: authenticated user
- `deleteUser`: ADMIN only

### Integration Notes

- Role management UI should keep delete action admin-only.
- Use pagination for user listing.

### Current Contract Gap

- GraphQL `UpdateUserInput` exposes `firstName/lastName/role`.
- Service validation expects `name/email/password/role`.
- Result: updates with `firstName/lastName` currently fail validation.

## 4.3 Documents

### Operations

- `query documents(pagination, status): DocumentList!`
- `query document(id: ID!): Document!`
- `mutation createDocument(input): Document!`
- `mutation updateDocument(id, input): Document!`
- `mutation archiveDocument(id): Document!`

### Required Frontend Behavior

- List with status filter (`DRAFT`, `REVIEW`, `APPROVED`, `ARCHIVED`).
- Create screen for managers/admins.
- Detail/update/archive actions shown based on role + ownership.

### Current Backend Authorization

- Create: ADMIN/MANAGER
- Read: any authenticated user
- Update/archive: ADMIN/MANAGER or creator

### Current Contract Gaps

- ID validation for `document(id)/update/archive` is UUID-based, but DB IDs are CUID.
  - Current effect: by-id document flows return 400.
- Update validation allows status values `DRAFT|ACTIVE|ARCHIVED`, but API/DB uses `DRAFT|REVIEW|APPROVED|ARCHIVED`.
  - Current effect: `REVIEW` and `APPROVED` updates return 400.

## 4.4 Non-Conformance

### Operations

- `query nonConformances(pagination, status, severity, reportedById): NonConformanceList!`
- `query nonConformance(id: ID!): NonConformance!`
- `mutation createNonConformance(input): NonConformance!`
- `mutation updateNonConformance(id, input): NonConformance!`
- `mutation closeNonConformance(id): NonConformance!`

### Required Frontend Behavior

- List/filter by `status`, `severity`, reporter.
- Create with business fields: title/description/severity.
- Support close flow with confirmation.

### Current Backend Authorization

- Create: any authenticated user
- Read: any authenticated user
- Update/close: ADMIN/MANAGER or reporter (creator)

### Current Contract Gaps

- ID validation for by-id operations is UUID-based; DB IDs are CUID.
  - Current effect: by-id read/update/close returns 400 with real IDs.
- GraphQL marks `severity` optional in create input, but service validation requires it.
  - Current effect: create without severity returns 400.
- Update validation status enum uses `OPEN|UNDER_INVESTIGATION|CLOSED`, while API/DB uses `OPEN|IN_PROGRESS|RESOLVED|CLOSED`.
  - Current effect: `IN_PROGRESS` and `RESOLVED` updates return 400.

## 4.5 Corrective Action

### Operations

- `query correctiveActions(pagination, status, nonConformanceId, assignedToId): CorrectiveActionList!`
- `query correctiveAction(id: ID!): CorrectiveAction!`
- `mutation createCorrectiveAction(input): CorrectiveAction!`
- `mutation updateCorrectiveAction(id, input): CorrectiveAction!`
- `mutation completeCorrectiveAction(id): CorrectiveAction!`

### Required Frontend Behavior

- List/filter by status, non-conformance link, assignee.
- Create/edit screens with link to non-conformance and optional assignee/due date.
- Completion flow for authorized users.

### Current Backend Authorization

- Create: ADMIN/MANAGER
- Read: any authenticated user
- Update/complete: ADMIN/MANAGER or assignee

### Current Contract Gaps

- `nonConformanceId`, `assignedToId`, and corrective action IDs are validated as UUID.
- DB IDs are CUID.
- Current effect:
  - create fails when using real non-conformance CUID IDs,
  - by-id read/update/complete fail with real IDs.

## 5. Role-to-Action Matrix (Current Behavior)

| Action | USER | MANAGER | ADMIN |
|---|---|---|---|
| Register/Login | ✅ | ✅ | ✅ |
| `me` | ✅ (authenticated) | ✅ | ✅ |
| List users | ✅ (authenticated) | ✅ | ✅ |
| Update user | ✅ (authenticated) | ✅ | ✅ |
| Delete user | ❌ | ❌ | ✅ |
| Create document | ❌ | ✅ | ✅ |
| Update/archive document | Creator-only path (but currently blocked by ID validation) | ✅ | ✅ |
| Create non-conformance | ✅ | ✅ | ✅ |
| Update/close non-conformance | Creator-only path (but currently blocked by ID validation) | ✅ | ✅ |
| Create corrective action | ❌ | ✅ | ✅ |
| Update/complete corrective action | Assignee-only path (but currently blocked by ID validation) | ✅ | ✅ |

## 6. Non-Functional Requirements for Frontend Integration

## 6.1 Security

- Use HTTPS in non-local environments.
- Store JWT in secure storage.
- Enforce logout by clearing token and client cache.
- Respect backend CORS origin configuration (`CORS_ORIGIN`).
- Backend env validation is strict (JWT secret strength, URL format, etc.); frontend environments must align with deployed origin and endpoint.

## 6.2 Reliability and Resilience

- Handle network failures, GraphQL errors, and partial rendering states.
- Implement 3 UI states for all async lists: loading / empty / error.
- Retry strategy should be conservative for mutations (avoid duplicate side effects).

## 6.3 Performance

- Use pagination on all list pages.
- Avoid over-fetching nested fields in GraphQL.
- Cache immutable or rarely changing reference data where possible.

## 6.4 Observability

- Parse and log `extensions.statusCode` and operation name on frontend.
- Keep user-facing errors simple and localized.
- Keep internal logs detailed enough for backend/frontend issue correlation.

## 6.5 Contract Governance

- Generate frontend GraphQL types from live schema (or committed schema snapshot).
- Use backend enums as source of truth.
- Add integration tests for critical flows: auth, list, detail, create, update, status transitions.

## 7. Critical Integration Risks (Current Backend State)

1. **CUID vs UUID mismatch** in document/non-conformance/corrective-action validators breaks most ID-based flows.
2. **Enum mismatches** between GraphQL schema and service validators cause valid GraphQL values to fail.
3. **User update input mismatch** (`firstName/lastName` in GraphQL vs `name` in validator) blocks expected profile updates.
4. **Escalation backend is not exposed** on active API surface despite existing Prisma models/module code.
5. **Error `extensions.code` is not a reliable business code**, so frontend must map using `extensions.statusCode` + message.

## 8. Integration Readiness Summary

### Ready

- Auth register/login/me
- Paginated list queries
- Create non-conformance (with explicit severity)

### Partially Ready / Blocked

- Document detail/update/archive flows (blocked by ID + enum validation)
- Non-conformance detail/update/close by ID (blocked by ID validation)
- Corrective-action create/link/detail/update/complete (blocked by ID validation)
- User profile update for first/last name (input mismatch)

---

**Conclusion:** frontend integration can proceed for authentication and list-oriented pages, but full workflow integration requires backend contract fixes on ID validation and enum/input alignment before production-ready end-to-end behavior.

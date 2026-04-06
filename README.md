# QMS Backend

Backend API for a Quality Management System (QMS), built with **TypeScript + GraphQL + Prisma + PostgreSQL**.

## Current status

Implemented and working:
- Auth (register/login/me)
- User module
- Document core (create/list/get/update/archive)
- NonConformance core (create/list/get/update/close)
- CorrectiveAction core (create/list/get/update/complete)
- Role-based authorization on write operations
- Jest test suite + coverage

## Tech stack

- Node.js / TypeScript
- Apollo Server (GraphQL)
- Express
- Prisma ORM
- PostgreSQL
- Jest + Supertest

## Database model

Prisma schema includes:
- `User`
- `Document`
- `NonConformance`
- `CorrectiveAction`
- `AuditLog`

Enums:
- `Role` (`ADMIN`, `MANAGER`, `USER`)
- `DocStatus`
- `Severity`
- `NCStatus`
- `ActionStatus`

## Authorization rules

- **Read queries**: authenticated users
- **Document writes**: `ADMIN` or `MANAGER`
- **NonConformance writes**: `ADMIN` or `MANAGER`
- **CorrectiveAction writes**: `ADMIN` or `MANAGER`
- `USER` is read-only for these modules

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL (Docker)

```bash
docker run -d \
  --name qms-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=qms_db \
  -p 5432:5432 \
  postgres:latest
```

### 3. Configure environment

Create `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/qms_db"
```

### 4. Generate Prisma client + run migrations + seed

```bash
npx prisma generate
npm run prisma:migrate
npm run prisma:seed
```

For staging/production deployments:

```bash
npm run prisma:migrate:deploy
```

### 5. Run API

```bash
npm run dev
```

API endpoints:
- GraphQL: `http://localhost:4000/graphql`
- Health: `http://localhost:4000/health`

### 6. Open Prisma dashboard

```bash
npm run prisma:studio
```

Prisma Studio opens (usually) on:
- `http://localhost:5555`

## Useful scripts

- `npm run dev` - run API in development
- `npm run build` - compile TypeScript
- `npm test` - run tests
- `npm run test:coverage` - run tests with coverage
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - create/apply development migration
- `npm run prisma:migrate:deploy` - apply committed migrations (staging/prod)
- `npm run prisma:seed` - seed users and domain demo data
- `npm run prisma:studio` - open Prisma Studio

## Default seeded users

- `admin@qms.com` / `admin123` (ADMIN)
- `manager@qms.com` / `manager123` (MANAGER)
- `user@qms.com` / `user123` (USER)

## GraphQL examples

### Login

```graphql
mutation {
  login(input: {
    email: "admin@qms.com"
    password: "admin123"
  }) {
    token
    user {
      id
      email
      role
    }
  }
}
```

Use returned token in header:

```http
Authorization: Bearer <TOKEN>
```

### Create document

```graphql
mutation {
  createDocument(input: {
    title: "SOP 001"
    content: "Initial content"
  }) {
    id
    title
    status
    version
  }
}
```

### Create non-conformance

```graphql
mutation {
  createNonConformance(input: {
    title: "Packaging issue"
    description: "Label mismatch"
    severity: HIGH
  }) {
    id
    title
    status
    severity
  }
}
```

### Create corrective action

```graphql
mutation {
  createCorrectiveAction(input: {
    action: "Update labeling SOP"
    nonConformanceId: "NON_CONF_ID"
  }) {
    id
    action
    status
  }
}
```

## Testing

Testing strategy in this repo:
- Jest for unit/resolver tests
- Supertest for API tests

Run:

```bash
npm test
npm run test:coverage
```

## Global TODO Roadmap

### API & Business Logic
- Add Zod input validation for Document, NonConformance, and CorrectiveAction mutations.
- Add richer filtering/sorting for list queries (date ranges, status, severity, assignee).
- Add pagination defaults/limits at resolver level to prevent unbounded queries.
- Add full AuditLog writes for create/update/archive/close/complete operations.

### Security & Access Control
- Add role guards to User module writes (explicit ADMIN/MANAGER boundaries).
- Add token refresh/logout flow.
- Add rate limiting and basic abuse protection on auth mutations.

### Data & Database
- Add realistic seed data for Document, NonConformance, CorrectiveAction, and AuditLog.
- Add migration/seed scripts for staging/production promotion.

### Testing & Quality
- Add service-layer unit tests (not only resolver tests).
- Add integration tests against test PostgreSQL for full GraphQL flows.
- Add negative-path tests for permissions and validation errors.
- Keep coverage thresholds enforced in CI.

### DevOps & Delivery
- Add CI pipeline: lint, test, coverage, build on every PR.
- Add environment-based config profiles (dev/staging/prod).
- Add Docker compose for app + postgres local stack.
- Add production runbook (backup, restore, migration, rollback).

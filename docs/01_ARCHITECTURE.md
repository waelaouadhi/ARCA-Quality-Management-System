# QMS Backend Architecture

## Overview
This backend is a TypeScript GraphQL API for QMS workflows, backed by PostgreSQL via Prisma.

The active runtime path is:

`src/index.ts -> src/graphql/index.ts -> src/modules/*`

## Source layout
```text
src/
├── index.ts                    # Main app entrypoint (used by dev/build scripts)
├── app.ts                      # Lightweight demo app factory (test/demo surface)
├── demo.ts                     # Legacy bootstrap variant
├── server.ts                   # Legacy bootstrap variant
├── config/
│   ├── index.ts                # Environment config
│   ├── database.ts             # Prisma client singleton
│   └── logger.ts               # Winston logger
├── graphql/
│   ├── base.ts                 # Base scalar + placeholder roots
│   └── index.ts                # GraphQL composition only
├── middlewares/
│   ├── auth.ts                 # Express auth middleware (not primary GraphQL path)
│   └── errorHandler.ts
├── shared/
│   ├── errors/                 # AppError hierarchy
│   ├── types/                  # Shared context types
│   └── utils/                  # jwt, password, pagination, error formatting
├── modules/
│   ├── auth/
│   ├── user/
│   ├── document/
│   ├── nonConformance/
│   └── correctiveAction/
└── __tests__/
```

Each module follows:
```text
<module>/
├── <module>.schema.ts
├── <module>.resolver.ts
├── <module>.service.ts
├── <module>.repository.ts
└── index.ts
```

## Layering rule (enforced)
All business modules follow:

`Resolver -> Service -> Repository -> Prisma`

Responsibilities:
1. **Resolver**: only maps GraphQL args/context to service calls.
2. **Service**: authorization checks + business/workflow logic.
3. **Repository**: Prisma queries only.
4. **Prisma Client**: centralized in `src/config/database.ts`.

## GraphQL composition model
- `src/graphql/index.ts` composes base + module schemas/resolvers.
- Domain resolvers live in `src/modules/*/*.resolver.ts`.
- `src/graphql/*` does not own domain business logic.

## Auth and authorization model
- JWT parsed in GraphQL context (`src/index.ts`).
- Authenticated user is injected as `context.user`.
- Access control is enforced in services:
  - **Document writes**: `ADMIN` or `MANAGER`
  - **NonConformance writes**: `ADMIN` or `MANAGER`
  - **CorrectiveAction writes**: `ADMIN` or `MANAGER`
  - **User delete**: `ADMIN`
  - Read operations require authenticated user

## Database architecture (Prisma)
Schema: `prisma/schema.prisma`

Core entities:
- `User`
- `Document`
- `NonConformance`
- `CorrectiveAction`
- `AuditLog`

Enums:
- `Role`: `ADMIN | MANAGER | USER`
- `DocStatus`: `DRAFT | REVIEW | APPROVED | ARCHIVED`
- `Severity`: `LOW | MEDIUM | HIGH | CRITICAL`
- `NCStatus`: `OPEN | IN_PROGRESS | RESOLVED | CLOSED`
- `ActionStatus`: `PENDING | IN_PROGRESS | DONE`

ID strategy:
- All model IDs use Prisma `cuid()` (not UUID).

## Seed data strategy
`prisma/seed.ts` provides deterministic demo data:
- Upserts core users (`admin`, `manager`, `user`)
- Recreates domain demo records for documents, non-conformances, corrective actions, audit logs
- Keeps relations realistic for local testing and Studio inspection

## Runtime and operations
Primary scripts (`package.json`):
- `npm run dev` -> nodemon + `src/index.ts`
- `npm run build` / `npm start`
- `npm run prisma:migrate` (dev migrations)
- `npm run prisma:migrate:deploy` (apply committed migrations)
- `npm run prisma:seed`
- `npm run prisma:studio`
- `npm test` / `npm run test:coverage`

## Current architectural status
- Layered module architecture is in place for `auth`, `user`, `document`, `nonConformance`, `correctiveAction`.
- Prisma access is isolated to repositories.
- GraphQL composition is centralized and thin.
- Tests currently cover resolver behavior and shared utilities.

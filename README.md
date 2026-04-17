# ARCA Quality Management System (QMS) Backend

Production-grade Node.js/TypeScript backend for a Quality Management System with GraphQL APIs, Prisma/PostgreSQL persistence, RBAC, workflow engine, AKS deployment, and end-to-end CI/CD hardening.

## Author

**Wael Aouadhi**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Repository Structure](#repository-structure)
6. [Domain Modules](#domain-modules)
7. [Environment Variables](#environment-variables)
8. [Local Development](#local-development)
9. [Testing, Linting, Build](#testing-linting-build)
10. [Docker](#docker)
11. [Kubernetes Deployment Model](#kubernetes-deployment-model)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Observability](#observability)
14. [Operations Runbook](#operations-runbook)
15. [Security Posture](#security-posture)
16. [Troubleshooting](#troubleshooting)
17. [Roadmap Status](#roadmap-status)

---

## Project Overview

This backend powers ARCA QMS business workflows including:

- Authentication and user management
- Document control
- Non-conformance and CAPA management
- Risk and audit management
- Supplier and complaint lifecycle
- Training and certification tracking
- Configurable workflow/state-machine transitions
- Permissions/RBAC and dashboard metrics

The service exposes a GraphQL API (`/graphql`) and operational endpoints (`/health`, `/metrics`).

---

## Core Features

- **GraphQL-first API** with module-based schemas/resolvers
- **Prisma + PostgreSQL** data layer with production-safe migrations
- **RBAC model** (`Permission`, `RolePermission`, `UserPermission`)
- **Workflow engine** with transition history and approvals
- **Cross-module automation** (e.g., audit/risk/CAPA interactions)
- **Environment validation** at startup using Zod
- **Prometheus metrics** endpoint and request instrumentation
- **AKS-ready Kubernetes manifests** with staging/production overlays
- **Secure CI/CD** (Trivy scan, Cosign sign/verify, controlled promotion)

---

## Technology Stack

| Area | Tech |
|---|---|
| Runtime | Node.js 20, TypeScript |
| API | Apollo Server, GraphQL, Express |
| Data | Prisma ORM, PostgreSQL |
| Auth | JWT, bcrypt |
| Validation | Zod |
| Logging | Winston |
| Caching | node-cache |
| Metrics | prom-client (Prometheus format) |
| Testing | Jest, Supertest |
| Containers | Docker |
| Orchestration | Kubernetes (AKS) |
| CI/CD | GitHub Actions |
| Registry | GHCR |

---

## Architecture

### Runtime flow

1. `src/index.ts` boots Express + Apollo Server
2. Environment loaded and validated from `src/config/env.ts`
3. Prisma client initialized (`src/config/database.ts`)
4. GraphQL modules merged in `src/graphql/index.ts`
5. Middleware stack applies CORS, JSON parser, metrics
6. Endpoints served:
   - `GET /health`
   - `GET /metrics`
   - `POST /graphql`

### Backend layering pattern

Most modules follow:

`schema.ts` → `validation.ts` → `repository.ts` → `service.ts` → `resolver.ts`

This keeps business logic centralized and reusable.

---

## Repository Structure

```text
.
├── src/
│   ├── config/
│   ├── graphql/
│   ├── middlewares/
│   ├── modules/
│   ├── shared/
│   └── __tests__/
├── prisma/
├── k8s/
│   ├── base/
│   ├── overlays/
│   │   ├── staging/
│   │   └── production/
│   └── monitoring/
├── .github/workflows/
└── Dockerfile
```

---

## Domain Modules

Current modules under `src/modules`:

- admin
- audit
- auth
- complaint
- correctiveAction
- dashboard
- document
- escalation
- nonConformance
- permission
- risk
- scope
- supplier
- training
- user
- workflow

---

## Environment Variables

Copy template:

```bash
cp .env.example .env
```

Required keys:

- `NODE_ENV` (`development | production | staging | test`)
- `PORT`
- `DATABASE_URL` (valid PostgreSQL URL)
- `JWT_SECRET` (minimum 32 chars, strong complexity enforced)
- `CORS_ORIGIN` (valid URL)
- `LOG_LEVEL`

Validation and fail-fast behavior live in `src/config/env.ts`.

---

## Local Development

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL

### Install and run

```bash
npm ci
npm run prisma:generate
npm run dev
```

Server endpoints:

- GraphQL: `http://localhost:4000/graphql`
- Health: `http://localhost:4000/health`
- Metrics: `http://localhost:4000/metrics`

---

## Testing, Linting, Build

```bash
npm run lint
npm run build
npm test -- --runInBand
npm run test:coverage
```

Useful extras:

```bash
npm run lint:fix
npm run format
```

---

## Docker

Multi-stage `Dockerfile`:

1. **builder**: install deps, generate Prisma client, compile TS
2. **runtime**: install production deps, generate Prisma client, run migrations, start server

Build and run:

```bash
docker build -t qms-backend .
docker run --rm -p 4000:4000 \
  -e NODE_ENV=production \
  -e DATABASE_URL='postgresql://...' \
  -e JWT_SECRET='...' \
  -e CORS_ORIGIN='https://your-frontend.example' \
  -e LOG_LEVEL=info \
  qms-backend
```

---

## Kubernetes Deployment Model

### App manifests

- `k8s/base/*`: base deployment/service/hpa
- `k8s/overlays/staging/*`: staging-specific patches
- `k8s/overlays/production/*`: production-specific patches

### Namespaces

- `qms-staging`
- `qms-production`
- `qms-observability`

### Apply examples

```bash
kubectl apply -k k8s/overlays/staging
kubectl apply -k k8s/overlays/production
kubectl apply -k k8s/monitoring
```

---

## CI/CD Pipeline

Workflow file: `.github/workflows/ci-cd.yml`

### CI stage

- Install/cache dependencies
- Generate Prisma client
- Sync DB schema for tests
- Lint, build, test
- Audit prod dependencies
- Build image
- Trivy scan
- Cosign keyless image signing

### CD stage

- Main-branch gated
- Preflight secret checks
- Signature verification before deploy
- Auto-target **staging** on `push` to `main`
- Manual promotion to **production** via `workflow_dispatch` + `image_tag`
- Kustomize overlay apply
- Rollout + smoke test
- Metrics and alert-rule verification
- Diagnostics + rollback on failure

---

## Observability

Monitoring stack manifests in `k8s/monitoring` include:

- Prometheus
- Alertmanager
- Grafana
- kube-state-metrics
- Alert rules + RBAC

### Metrics endpoint

Application exports Prometheus metrics via:

- `GET /metrics`

Includes:

- Request count (`qms_backend_http_requests_total`)
- Request duration histogram (`qms_backend_http_request_duration_seconds_*`)
- Process/system default metrics (`qms_backend_process_*`, etc.)

### Open dashboards/pages locally

```bash
kubectl port-forward svc/prometheus -n qms-observability 9090:9090
kubectl port-forward svc/grafana -n qms-observability 3000:3000
kubectl port-forward svc/qms-backend -n qms-staging 4001:4000
```

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (default admin/admin)
- App metrics: `http://localhost:4001/metrics`

---

## Operations Runbook

### Promote tested image to production

Use GitHub Actions manual run:

- `deploy_environment=production`
- `image_tag=<tested_commit_sha>`

### Restart backend deployment

```bash
kubectl rollout restart deployment/qms-backend -n qms-staging
kubectl rollout restart deployment/qms-backend -n qms-production
```

### Rollout status

```bash
kubectl rollout status deployment/qms-backend -n qms-staging
kubectl rollout status deployment/qms-backend -n qms-production
```

### Quick diagnostics

```bash
kubectl get deploy,pods,svc,hpa -n qms-staging
kubectl describe deployment/qms-backend -n qms-staging
kubectl logs deployment/qms-backend --all-containers=true --tail=200 -n qms-staging
```

---

## Security Posture

- Strict environment validation at startup
- JWT minimum strength and complexity checks
- RBAC with role defaults + user overrides
- CI vulnerability gates (audit + Trivy)
- Supply-chain signing and signature verification (Cosign)
- Main-only deployment path with guarded promotion
- Deployment traceability annotations (actor, sha, run-id, env)

---

## Troubleshooting

### `namespace not found` during kubectl commands

You are likely on the wrong cluster context.

```bash
kubectl config current-context
az aks get-credentials --resource-group qms-rg --name qms-aks --overwrite-existing
```

### CI deploy fails but rollout looked healthy

Check post-deploy checks and diagnostics in workflow logs, especially:

- metrics verification step
- alert-rules verification step

### Pod scheduling timeout

Staging overlay is tuned for constrained clusters (`maxUnavailable: 1`, `maxSurge: 0`).  
If needed, reduce app resource requests or scale nodepool.

---

## Roadmap Status

Phases delivered in this backend:

- Phase 1–4: core backend + AKS + GHCR + production DB path
- Phase 5: supply-chain hardening (scan/sign/verify)
- Phase 6: Kustomize overlays + promotion flow
- Phase 7: observability stack + metrics + alert checks

---

If you want, the next step is Phase 8 maintenance hardening (dependency automation, runtime/action upgrade governance, periodic security revalidation).

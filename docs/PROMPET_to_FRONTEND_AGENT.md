# PROMPET to Frontend Agent

Use this prompt pack to guide a Flutter frontend agent that integrates cleanly with the QMS backend described in `docs/BackendToFrontend.md`.

## How to use

Run the prompts in order. Each prompt builds on the previous one. The agent should not invent backend fields, endpoints, or workflows. It must follow the backend guide exactly.

## Global Rules for the Frontend Agent

- Build for **Flutter**.
- Use **GraphQL** as the main API layer.
- Use the backend schema and examples exactly as documented.
- Use **JWT auth** with secure token storage.
- Respect backend **roles**: `ADMIN`, `MANAGER`, `USER`.
- Respect backend **pagination**, **filters**, **error codes**, and **date formats**.
- Keep UI clean, scalable, and ready for production.
- If something is ambiguous, ask before assuming.

---

## Prompt 1 — Product Understanding and Frontend Plan

**Goal:** Understand the backend and produce a Flutter app plan before writing code.

**Prompt:**

You are a senior Flutter frontend engineer. Study the backend integration guide in `docs/BackendToFrontend.md` and produce a complete frontend implementation plan for the QMS app.

Your job:

1. Identify all backend modules and their user-facing screens.
2. Map backend GraphQL operations to frontend pages, widgets, and state flows.
3. Define the app architecture you will use in Flutter.
4. Define the folder structure.
5. Define the data models you will need.
6. Define the auth flow, role-based access flow, pagination flow, and error flow.
7. List any unclear items as questions instead of assuming.

Backend facts you must follow:

- API type: GraphQL
- Base URL: `http://localhost:4000/graphql`
- Health check endpoint: `http://localhost:4000/health`
- Modules: Auth, Users, Documents, Non-Conformances, Corrective Actions, Escalation
- Auth uses JWT
- Roles: ADMIN, MANAGER, USER
- IDs are CUID format
- Dates are ISO 8601
- Pagination uses `page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`

Required output:

- App architecture choice
- Screen map
- Folder structure
- State management choice
- API client strategy
- List of questions/blockers

Do not write code yet. Only produce the plan.

---

## Prompt 2 — Project Foundation and API Layer

**Goal:** Create the Flutter foundation and connect it to the backend safely.

**Prompt:**

Now implement the Flutter project foundation based on the plan and the backend guide.

Build:

1. App bootstrap and routing structure.
2. GraphQL client setup with auth link.
3. Secure JWT storage.
4. Shared error handling layer.
5. Shared pagination model.
6. Shared base models and enums matching backend values.
7. Health-check utility for the backend.

Use the backend guide exactly:

- GraphQL endpoint: `http://localhost:4000/graphql`
- Health endpoint: `http://localhost:4000/health`
- Auth token format: `Bearer <token>`
- Response errors must map to `UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`

Implementation rules:

- Use Flutter best practices.
- Keep networking isolated in a dedicated data layer.
- Use immutable models where possible.
- Prepare the app for caching and offline-friendly behavior.
- Do not hardcode fake backend fields.

Required output:

- Working app foundation
- API client
- Auth storage
- Shared models
- Error mapper
- Folder structure actually created

---

## Prompt 3 — Auth and Role-Based Access

**Goal:** Implement login, registration, logout, session restore, and role-aware UI guards.

**Prompt:**

Implement the authentication module for the Flutter app using the backend GraphQL schema.

Build:

1. Registration screen and flow.
2. Login screen and flow.
3. Logout flow.
4. Session restore on app startup.
5. Current user loading via `me`.
6. Role-based UI visibility and access rules.

Backend operations to use:

- `register(input: RegisterInput!)`
- `login(input: LoginInput!)`
- `me`

User fields to expect:

- `id`
- `email`
- `firstName`
- `lastName`
- `role`
- `createdAt`
- `updatedAt`

Rules:

- Store tokens securely.
- Decode token only for client-side convenience; never trust client-side role data alone for security.
- Use backend error messages for invalid credentials and validation failures.
- Match backend password rules exactly.

Required output:

- Auth screens
- Auth repository/service
- Session persistence
- Role guard helper
- Clean loading/error states

---

## Prompt 4 — Core Modules and CRUD Workflows

**Goal:** Build the main business screens and GraphQL data flows.

**Prompt:**

Implement the core QMS modules using the backend schema and examples:

1. Users
2. Documents
3. Non-Conformances
4. Corrective Actions

For each module, build:

- list screen
- detail screen
- create form
- edit/update form
- delete/archive/close/complete action where supported
- pagination support
- filters where supported

Backend operations to support:

- Users: `users`, `user(id)`, `updateUser`, `deleteUser`
- Documents: `documents`, `document(id)`, `createDocument`, `updateDocument`, `archiveDocument`
- Non-Conformances: `nonConformances`, `nonConformance(id)`, `createNonConformance`, `updateNonConformance`, `closeNonConformance`
- Corrective Actions: `correctiveActions`, `correctiveAction(id)`, `createCorrectiveAction`, `updateCorrectiveAction`, `completeCorrectiveAction`

Important backend fields:

- Document: `title`, `content`, `version`, `status`, `createdBy`
- Non-Conformance: `title`, `description`, `severity`, `status`, `reportedBy`, `correctiveActions`
- Corrective Action: `action`, `status`, `nonConformance`, `assignedTo`, `dueDate`

Rules:

- Use the exact enum values from the backend.
- Respect role restrictions from the backend guide.
- Use pagination consistently on list screens.
- Make all forms validate before submit.

Required output:

- Feature screens
- Repositories
- View models/BLoCs/controllers
- Query/mutation constants
- Form validation

---

## Prompt 5 — Hardening, UX Polish, and Final QA

**Goal:** Make the frontend production-ready and easy to use.

**Prompt:**

Review the full Flutter app and improve it for production quality using the backend integration guide.

Focus on:

1. Better loading, empty, and error states.
2. Offline/cached experience where possible.
3. Date formatting and timezone handling.
4. CUID ID display and validation.
5. Permission-aware UI hiding/disabling.
6. Network failure handling.
7. Consistent form validation.
8. Final cleanup and refactor.

Hard constraints:

- Do not change backend behavior in the frontend.
- Do not invent missing mutations or fields.
- Keep UI aligned with the backend roles and data shape.
- Keep the app easy for a real user to navigate.

Required output:

- Production-ready polish
- Final QA checklist
- Any remaining backend questions

---

## Best Execution Order

1. Prompt 1 — understand and plan
2. Prompt 2 — foundation
3. Prompt 3 — auth
4. Prompt 4 — core modules
5. Prompt 5 — polish and QA


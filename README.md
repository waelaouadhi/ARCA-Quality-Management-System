# 🏢 ARCA Quality Management System

A comprehensive **Quality Management System (QMS)** designed to help organizations manage quality processes, non-conformances, corrective actions, documents, and audits in compliance with industry standards.

---

## 📁 Repository Structure

This repository contains **two separate branches** for the complete QMS solution:

### 🔹 [`backend`](https://github.com/waelaouadhi/ARCA-Quality-Management-System/tree/backend) - API & Business Logic
**Built with:** Node.js, TypeScript, GraphQL, Prisma, PostgreSQL

The backend provides a robust GraphQL API with:
- ✅ Clean 3-layer architecture (Resolver → Service → Repository)
- ✅ JWT authentication & role-based access control
- ✅ 91% test coverage with comprehensive unit tests
- ✅ Database migrations & seed data
- ✅ Production-ready error handling & logging

**[→ View Backend Documentation](#-backend-documentation)**

### 🔹 [`frontend`](https://github.com/waelaouadhi/ARCA-Quality-Management-System/tree/frontend) - User Interface
**Built with:** Flutter (Cross-platform mobile & web app)

The frontend will provide an intuitive interface for:
- 🎨 Modern, responsive UI
- 📊 Dashboard & analytics
- 📝 Document management
- 🔔 Real-time notifications
- 📱 Mobile-friendly design (iOS, Android, Web)

---

## 🎯 Core Features

### 📄 Document Management
- Create, update, archive documents
- Support for policies, procedures, forms, and records
- Version control & approval workflows
- Document categorization & search

### ⚠️ Non-Conformance Management
- Report and track quality issues
- Severity classification (LOW, MEDIUM, HIGH, CRITICAL)
- Status workflow (OPEN → UNDER_INVESTIGATION → CLOSED)
- Root cause analysis

### 🔧 Corrective Actions
- Create actions linked to non-conformances
- Assign responsibilities
- Track completion status
- Due date management
- Effectiveness verification

### 👥 User & Access Management
- Role-based access control (ADMIN, MANAGER, USER, VIEWER)
- JWT authentication
- Secure password hashing
- User profile management

### 📊 Audit Logging
- Comprehensive activity tracking
- Who did what, when, and why
- Compliance & traceability
- Audit trail for all critical operations

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18+ | Runtime environment |
| TypeScript | Type-safe development |
| GraphQL (Apollo Server) | API layer |
| Prisma ORM | Database access |
| PostgreSQL | Relational database |
| JWT | Authentication |
| Jest | Testing framework |
| ESLint + Prettier | Code quality |

### Frontend
| Technology | Purpose |
|------------|---------|
| Flutter | Cross-platform framework |
| Dart | Programming language |
| GraphQL Flutter | GraphQL client |
| Provider / Riverpod | State management |
| Material Design 3 | UI components |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/waelaouadhi/ARCA-Quality-Management-System.git
cd ARCA-Quality-Management-System

# Switch to backend branch
git checkout backend

# Install dependencies
npm install

# Start PostgreSQL (Docker)
docker run -d \
  --name qms-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=qms_db \
  -p 5432:5432 \
  postgres:latest

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed

# Start development server
npm run dev
```

**Backend will be running at:** http://localhost:4000  
**GraphQL Playground:** http://localhost:4000/graphql

### Frontend Setup

```bash
# Switch to frontend branch
git checkout frontend

# Install Flutter dependencies
flutter pub get

# Run on your preferred platform
flutter run -d chrome        # Web
flutter run -d ios           # iOS simulator
flutter run -d android       # Android emulator

# Build for production
flutter build apk            # Android
flutter build ios            # iOS
flutter build web            # Web
```

---

## 📚 Backend Documentation

### Default Seeded Users

| Email | Password | Role |
|-------|----------|------|
| admin@qms.com | admin123 | ADMIN |
| manager@qms.com | manager123 | MANAGER |
| user@qms.com | user123 | USER |

### GraphQL API Examples

#### 🔐 Authentication

**Login:**
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

**Use token in headers:**
```http
Authorization: Bearer <YOUR_TOKEN>
```

#### 📄 Document Operations

**Create Document:**
```graphql
mutation {
  createDocument(input: {
    title: "SOP-001: Quality Control Procedure"
    content: "Detailed procedure content..."
    type: PROCEDURE
  }) {
    id
    title
    status
    version
    createdAt
  }
}
```

**List Documents:**
```graphql
query {
  documents {
    id
    title
    status
    type
    version
    createdBy {
      name
      email
    }
  }
}
```

#### ⚠️ Non-Conformance Operations

**Create Non-Conformance:**
```graphql
mutation {
  createNonConformance(input: {
    title: "Product Label Mismatch"
    description: "Batch #12345 has incorrect expiration date on labels"
    severity: HIGH
  }) {
    id
    title
    status
    severity
    createdAt
  }
}
```

**Close Non-Conformance:**
```graphql
mutation {
  closeNonConformance(id: "clx...") {
    id
    status
    closedAt
  }
}
```

#### 🔧 Corrective Action Operations

**Create Corrective Action:**
```graphql
mutation {
  createCorrectiveAction(input: {
    action: "Update labeling SOP and retrain staff"
    nonConformanceId: "clx..."
    assignedTo: "user-id"
    dueDate: "2026-05-01"
  }) {
    id
    action
    status
    assignedTo {
      name
      email
    }
  }
}
```

### Authorization Rules

| Operation | Required Role |
|-----------|---------------|
| Read queries | Authenticated user |
| Document writes | ADMIN or MANAGER |
| NonConformance writes | ADMIN or MANAGER |
| CorrectiveAction writes | ADMIN or MANAGER |
| User deletion | ADMIN only |

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Current Coverage:** 91% (80 passing tests)

Test Suites:
- ✅ Service layer tests (business logic)
- ✅ Resolver tests (GraphQL layer)
- ✅ Shared utilities tests
- ✅ API integration tests

---

## 🏗️ Architecture Overview

### Clean 3-Layer Architecture

```
┌─────────────────────────────────────────┐
│   GraphQL Resolvers (Presentation)      │
│   - Receive requests                     │
│   - Forward to services                  │
│   - Return responses                     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Services (Business Logic)              │
│   - Authorization checks                 │
│   - Validation                           │
│   - Workflow orchestration               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Repositories (Data Access)             │
│   - Prisma queries                       │
│   - Database operations                  │
│   - Transaction management               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   PostgreSQL Database                    │
└─────────────────────────────────────────┘
```

**Key Principles:**
- 🔒 Separation of concerns
- 🧪 Testable layers (mocked dependencies)
- 🔄 Clean data flow
- 📦 Modular architecture

**[Read Full Architecture Documentation](./ARCHITECTURE.md)**

---

## 📊 Database Schema

### Core Entities

- **User** - System users with roles and authentication
- **Document** - Quality documents (policies, procedures, forms, records)
- **NonConformance** - Quality issues and deviations
- **CorrectiveAction** - Actions to address non-conformances
- **AuditLog** - Activity tracking for compliance

### Relationships

```
User ──1:N─→ Document
User ──1:N─→ NonConformance (created by)
User ──1:N─→ CorrectiveAction (assigned to)
NonConformance ──1:N─→ CorrectiveAction
User ──1:N─→ AuditLog
```

### Enums

- **Role:** ADMIN, MANAGER, USER, VIEWER
- **DocumentType:** POLICY, PROCEDURE, FORM, RECORD
- **DocumentStatus:** DRAFT, ACTIVE, ARCHIVED
- **Severity:** LOW, MEDIUM, HIGH, CRITICAL
- **NCStatus:** OPEN, UNDER_INVESTIGATION, CLOSED
- **ActionStatus:** PENDING, IN_PROGRESS, DONE

---

## 🔐 Security Features

- ✅ JWT token authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control (RBAC)
- ✅ Input validation
- ✅ SQL injection protection (Prisma parameterization)
- ✅ Error sanitization
- 🔜 Rate limiting (planned)
- 🔜 Refresh tokens (planned)
- 🔜 Security headers (planned)

---

## 🗺️ Roadmap & Enhancements

**[View Full TODO & Roadmap](./TODO.md)** - 25+ planned enhancements

### 🔥 High Priority (Sprint 1-2)
- [ ] Input validation with Zod
- [ ] Centralized audit logging
- [ ] Transaction-safe workflows
- [ ] Repository integration tests
- [ ] CI/CD pipeline

### 🔧 Medium Priority (Sprint 3-4)
- [ ] Rate limiting & query complexity limits
- [ ] Request ID tracing
- [ ] Refresh token implementation
- [ ] Performance monitoring
- [ ] Caching layer (Redis)

### 💡 Future Features
- [ ] File upload support
- [ ] Email notifications
- [ ] GraphQL subscriptions (real-time)
- [ ] Advanced full-text search
- [ ] Mobile app

---

## 📝 Useful Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build TypeScript
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:migrate:deploy  # Deploy migrations (prod)
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio

# Testing & Quality
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format with Prettier

# Utilities
npm run clean            # Clean dist folder
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Switch to the appropriate branch:**
   - Backend features: `git checkout backend`
   - Frontend features: `git checkout frontend`
4. **Make your changes**
5. **Run tests** (`npm test`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to your fork** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Development Guidelines

- ✅ Write tests for new features
- ✅ Follow existing code style (ESLint + Prettier)
- ✅ Update documentation
- ✅ Keep commits atomic and meaningful
- ✅ Ensure all tests pass before submitting PR

---

## 📂 Additional Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design & architecture patterns
- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[TODO.md](./TODO.md)** - Enhancement roadmap with detailed implementation plans

---

## 📝 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 👥 Team

**ARCA Quality Management System** - Built with ❤️ for better quality management

---

## 📞 Support

- 📧 **Email:** support@arca-qms.com
- 📖 **Documentation:** [View Docs](https://github.com/waelaouadhi/ARCA-Quality-Management-System/tree/backend)
- 🐛 **Issues:** [GitHub Issues](https://github.com/waelaouadhi/ARCA-Quality-Management-System/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/waelaouadhi/ARCA-Quality-Management-System/discussions)

---

## 🌟 Show Your Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Contributing code
- 📢 Sharing with others

---

**Built with modern technologies for quality management excellence.**

🔗 **Repository:** https://github.com/waelaouadhi/ARCA-Quality-Management-System

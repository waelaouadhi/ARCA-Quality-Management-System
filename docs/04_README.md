# QMS Backend

A professional Quality Management System backend built with TypeScript, GraphQL, Prisma, and PostgreSQL.

## 🚀 Features

- **GraphQL API** with Apollo Server
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **JWT Authentication** with bcrypt password hashing
- **Role-Based Access Control** (RBAC)
- **Modular Architecture** with clean separation of concerns
- **Comprehensive Error Handling**
- **Logging** with Winston
- **Input Validation** with Zod
- **Code Quality** with ESLint and Prettier

## 📁 Project Structure

```
src/
├── config/              # Configuration files
│   ├── index.ts        # Main config
│   ├── database.ts     # Prisma client
│   └── logger.ts       # Winston logger
├── shared/             # Shared utilities
│   ├── errors/         # Custom error classes
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   └── interfaces/     # TypeScript interfaces
├── middlewares/        # Express/GraphQL middlewares
│   ├── auth.ts         # Authentication middleware
│   └── errorHandler.ts # Error handling
├── modules/            # Feature modules
│   ├── auth/           # Authentication module
│   ├── user/           # User management
│   ├── document/       # Document control
│   ├── nonConformance/ # Non-conformance tracking
│   └── correctiveAction/ # Corrective actions
├── graphql/            # GraphQL schema
│   ├── typeDefs/       # Type definitions
│   └── resolvers/      # Resolvers
└── index.ts            # Application entry point
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **API**: GraphQL (Apollo Server)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Logging**: Winston
- **Validation**: Zod
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier

## 📦 Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run migrations:
```bash
npm run prisma:migrate
```

7. Seed the database (optional):
```bash
npm run prisma:seed
```

## 🚦 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed the database
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## 🔐 Default Users (after seeding)

- **Admin**: admin@qms.com / admin123
- **User**: user@qms.com / user123

## 📚 API Documentation

The GraphQL playground is available at: `http://localhost:4000/graphql`

### Example Queries

#### Register User
```graphql
mutation {
  register(input: {
    email: "john@example.com"
    password: "password123"
    firstName: "John"
    lastName: "Doe"
  }) {
    token
    user {
      id
      email
      firstName
      lastName
    }
  }
}
```

#### Login
```graphql
mutation {
  login(input: {
    email: "john@example.com"
    password: "password123"
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

#### Get Current User
```graphql
query {
  me {
    id
    email
    firstName
    lastName
    role
  }
}
```

## 🏗️ Architecture Principles

- **Clean Architecture**: Separation of concerns with layers
- **Domain-Driven Design**: Modules organized by business domain
- **SOLID Principles**: Maintainable and scalable code
- **Repository Pattern**: Abstraction of data access
- **Service Layer**: Business logic isolation
- **Dependency Injection**: Loose coupling

## 🔒 Security

- JWT-based authentication
- Bcrypt password hashing
- Role-based access control
- Input validation
- SQL injection prevention (Prisma)
- CORS configuration
- Environment variable protection

## 📈 Database Schema

The system includes models for:
- **Users**: User management with roles
- **Documents**: Document control system
- **Non-Conformances**: Quality issues tracking
- **Corrective Actions**: Action management
- **Audit Logs**: Activity tracking

## 🧪 Testing

Testing strategy:
- **Jest** for unit testing
- **Supertest** for API testing
- **In-memory DB or test PostgreSQL** for data-layer tests

```bash
npm test
```

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
# Global TODO Roadmap

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
- Replace `prisma db push` development flow with Prisma migrations for all environments.
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

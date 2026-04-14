# QMS Backend - Quick Start Guide

## ⚡ Quick Commands

### First Time Setup
```bash
npm install                    # Install all dependencies
npm run prisma:generate       # Generate Prisma client
cp .env.example .env          # Create environment file
# Edit .env with your DATABASE_URL
npm run prisma:migrate        # Run database migrations
npm run prisma:seed           # Seed users + realistic QMS demo data
npm run dev                   # Start development server
```

### Daily Development
```bash
npm run dev                   # Start dev server (auto-reload)
npm run build                 # Build for production
npm run lint:fix              # Fix code style issues
npm run format                # Format all code
```

### Database Management
```bash
npm run prisma:studio         # Open database GUI
npm run prisma:generate       # Regenerate Prisma client after schema changes
npm run prisma:migrate        # Create and run new migrations
npm run prisma:migrate:deploy # Apply committed migrations (staging/prod)
```

## 🔑 Default Credentials (after seeding)

**Admin User**
- Email: admin@qms.com
- Password: admin123
- Role: ADMIN

**Manager User**
- Email: manager@qms.com
- Password: manager123
- Role: MANAGER

**Regular User**
- Email: user@qms.com
- Password: user123
- Role: USER

## 📡 GraphQL Examples

### 1. Register New User
```graphql
mutation {
  register(input: {
    email: "test@example.com"
    password: "test123"
    firstName: "Test"
    lastName: "User"
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

### 2. Login
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
      firstName
      lastName
      role
    }
  }
}
```

### 3. Get Current User (requires auth token)
```graphql
# Add to HTTP Headers:
# {
#   "Authorization": "Bearer YOUR_TOKEN_HERE"
# }

query {
  me {
    id
    email
    firstName
    lastName
    role
    isActive
  }
}
```

### 4. List Users (requires auth)
```graphql
query {
  users(pagination: { page: 1, limit: 10 }) {
    data {
      id
      email
      firstName
      lastName
      role
    }
    pagination {
      page
      total
      totalPages
      hasNext
      hasPrev
    }
  }
}
```

### 5. Update User (requires auth)
```graphql
mutation {
  updateUser(
    id: "USER_ID_HERE"
    input: {
      firstName: "Updated"
      lastName: "Name"
    }
  ) {
    id
    firstName
    lastName
  }
}
```

## 🏗️ Project Structure Overview

```
src/
├── config/           → App configuration, database, logger
├── shared/           → Reusable utilities, errors, types
├── middlewares/      → Express/GraphQL middleware
├── modules/          → Feature modules (auth, user, etc.)
├── graphql/          → GraphQL schema & resolvers
└── index.ts          → App entry point
```

## 🔧 Environment Variables

Create `.env` with:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/qms_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

## 📊 HTTP Endpoints

- GraphQL API: `http://localhost:4000/graphql`
- Health Check: `http://localhost:4000/health`

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@/config'"
**Solution**: Run `npm install` to ensure tsconfig-paths is installed

### Issue: Prisma client not generated
**Solution**: Run `npm run prisma:generate`

### Issue: Database connection error
**Solution**: Check your DATABASE_URL in .env file

### Issue: JWT token invalid
**Solution**: Make sure to include "Bearer " prefix in Authorization header

### Issue: Build errors
**Solution**: Delete node_modules and dist, then run `npm install && npm run build`

## 📝 Adding New Features

### 1. Create New Module
```bash
mkdir -p src/modules/yourmodule
touch src/modules/yourmodule/{index.ts,yourmodule.service.ts,yourmodule.resolver.ts,yourmodule.schema.ts}
```

### 2. Add to Prisma Schema
Edit `prisma/schema.prisma`, then:
```bash
npm run prisma:migrate
npm run prisma:generate
```

### 3. Register GraphQL Schema
Edit `src/graphql/index.ts` to import and merge your typeDefs and resolvers

## 🧪 Testing (when tests are written)

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

## 🚀 Production Deployment

```bash
npm run build           # Compile TypeScript
npm start               # Run production server
```

Or use PM2:
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name qms-backend
```

## 📚 Learn More

- [Prisma Docs](https://www.prisma.io/docs/)
- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Docs](https://graphql.org/learn/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

**Built with ❤️ using modern best practices**

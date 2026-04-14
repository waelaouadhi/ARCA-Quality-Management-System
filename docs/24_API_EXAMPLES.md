# QMS Backend API - Usage Examples

This document provides practical examples for interacting with the QMS Backend API.

## Base URL

```
GraphQL Endpoint: http://localhost:4000/graphql
Health Check: http://localhost:4000/health
```

---

## 1. Health Check

**Request:**

```bash
curl http://localhost:4000/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-07T11:09:47.370Z"
}
```

---

## 2. User Registration

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Register($input: RegisterInput!) { register(input: $input) { token user { id email firstName lastName role createdAt } } }",
    "variables": {
      "input": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "password": "SecurePassword123!"
      }
    }
  }'
```

**Response:**

```json
{
  "data": {
    "register": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "cmnoiowm70007s7wwwmi4i5wl",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER",
        "createdAt": "2026-04-07T11:09:47.459Z"
      }
    }
  }
}
```

---

## 3. User Login

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($input: LoginInput!) { login(input: $input) { token user { id email firstName lastName role } } }",
    "variables": {
      "input": {
        "email": "john.doe@example.com",
        "password": "SecurePassword123!"
      }
    }
  }'
```

**Response:**

```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "cmnoiowm70007s7wwwmi4i5wl",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER"
      }
    }
  }
}
```

**Extract Token:**

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($input: LoginInput!) { login(input: $input) { token } }",
    "variables": {
      "input": {
        "email": "john.doe@example.com",
        "password": "SecurePassword123!"
      }
    }
  }' | jq -r '.data.login.token')

echo "Token: $TOKEN"
```

---

## 4. Get Current User (Me)

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { me { id email firstName lastName role createdAt } }"
  }'
```

**Response:**

```json
{
  "data": {
    "me": {
      "id": "cmnoiowm70007s7wwwmi4i5wl",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "createdAt": "2026-04-07T11:09:47.459Z"
    }
  }
}
```

---

## 5. List All Users (Paginated)

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query Users($pagination: PaginationInput) { users(pagination: $pagination) { data { id email firstName lastName role } pagination { page limit total totalPages hasNext hasPrev } } }",
    "variables": {
      "pagination": {
        "page": 1,
        "limit": 10
      }
    }
  }'
```

**Response:**

```json
{
  "data": {
    "users": {
      "data": [
        {
          "id": "cmnn5rviu0000s7mga1gesv0i",
          "email": "admin@qms.com",
          "firstName": "Admin",
          "lastName": "Salemi",
          "role": "ADMIN"
        },
        {
          "id": "cmnn5rvl00001s7mgvaz9bm6j",
          "email": "user@qms.com",
          "firstName": "Regular",
          "lastName": "Karim",
          "role": "USER"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 11,
        "totalPages": 2,
        "hasNext": true,
        "hasPrev": false
      }
    }
  }
}
```

---

## 6. Get Single User by ID

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query User($id: ID!) { user(id: $id) { id email firstName lastName role createdAt updatedAt } }",
    "variables": {
      "id": "cmnoiowm70007s7wwwmi4i5wl"
    }
  }'
```

**Response:**

```json
{
  "data": {
    "user": {
      "id": "cmnoiowm70007s7wwwmi4i5wl",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "createdAt": "2026-04-07T11:09:47.459Z",
      "updatedAt": "2026-04-07T11:09:47.459Z"
    }
  }
}
```

---

## 7. List Documents (Paginated)

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query Documents($pagination: PaginationInput) { documents(pagination: $pagination) { data { id title content version status createdBy { id firstName lastName } createdAt } pagination { page limit total totalPages hasNext hasPrev } } }",
    "variables": {
      "pagination": {
        "page": 1,
        "limit": 10
      }
    }
  }'
```

**Response:**

```json
{
  "data": {
    "documents": {
      "data": [
        {
          "id": "doc-123",
          "title": "Quality Manual",
          "content": "This is the quality manual...",
          "version": 1,
          "status": "DRAFT",
          "createdBy": {
            "id": "cmnn5rviu0000s7mga1gesv0i",
            "firstName": "Admin",
            "lastName": "Salemi"
          },
          "createdAt": "2026-04-01T10:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 5,
        "totalPages": 1,
        "hasNext": false,
        "hasPrev": false
      }
    }
  }
}
```

---

## 8. Get Single Document by ID

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query Document($id: ID!) { document(id: $id) { id title content version status createdBy { id firstName lastName email } createdAt updatedAt } }",
    "variables": {
      "id": "doc-123"
    }
  }'
```

---

## 9. Create Document (ADMIN/MANAGER only)

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "query": "mutation CreateDocument($input: CreateDocumentInput!) { createDocument(input: $input) { id title content version status createdAt } }",
    "variables": {
      "input": {
        "title": "New Quality Procedure",
        "content": "This document describes the quality procedure for...",
        "version": 1,
        "status": "DRAFT"
      }
    }
  }'
```

---

## 10. List Non-Conformances

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query NonConformances($pagination: PaginationInput) { nonConformances(pagination: $pagination) { data { id title description severity status createdBy { firstName lastName } createdAt } pagination { total hasNext } } }",
    "variables": {
      "pagination": {
        "page": 1,
        "limit": 10
      }
    }
  }'
```

---

## 11. Create Non-Conformance

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation CreateNC($input: CreateNonConformanceInput!) { createNonConformance(input: $input) { id title description severity status createdAt } }",
    "variables": {
      "input": {
        "title": "Equipment Calibration Overdue",
        "description": "Measurement equipment X123 has exceeded calibration due date",
        "severity": "MAJOR",
        "detectedDate": "2026-04-07T10:00:00Z"
      }
    }
  }'
```

---

## 12. List Corrective Actions

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query CorrectiveActions($pagination: PaginationInput) { correctiveActions(pagination: $pagination) { data { id title description status priority dueDate assignedTo { firstName lastName } createdAt } pagination { total } } }",
    "variables": {
      "pagination": {
        "page": 1,
        "limit": 10
      }
    }
  }'
```

---

## 13. Create Corrective Action

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation CreateCA($input: CreateCorrectiveActionInput!) { createCorrectiveAction(input: $input) { id title description status priority dueDate createdAt } }",
    "variables": {
      "input": {
        "nonConformanceId": "nc-123",
        "title": "Recalibrate Equipment X123",
        "description": "Schedule and perform calibration of equipment X123",
        "priority": "HIGH",
        "dueDate": "2026-04-15T00:00:00Z",
        "assignedToId": "user-456"
      }
    }
  }'
```

---

## 14. Update User Profile

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation UpdateUser($id: ID!, $input: UpdateUserInput!) { updateUser(id: $id, input: $input) { id firstName lastName email } }",
    "variables": {
      "id": "cmnoiowm70007s7wwwmi4i5wl",
      "input": {
        "firstName": "John",
        "lastName": "Smith"
      }
    }
  }'
```

---

## Error Examples

### 1. Missing Authentication

**Request without token:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { users(pagination: {page: 1, limit: 10}) { data { id } } }"
  }'
```

**Error Response:**

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### 2. Invalid Credentials

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($input: LoginInput!) { login(input: $input) { token } }",
    "variables": {
      "input": {
        "email": "john.doe@example.com",
        "password": "WrongPassword"
      }
    }
  }'
```

**Error Response:**

```json
{
  "errors": [
    {
      "message": "Invalid credentials",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### 3. Weak Password

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Register($input: RegisterInput!) { register(input: $input) { token } }",
    "variables": {
      "input": {
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "123"
      }
    }
  }'
```

**Error Response:**

```json
{
  "errors": [
    {
      "message": "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
      "extensions": {
        "code": "BAD_USER_INPUT"
      }
    }
  ]
}
```

### 4. Invalid UUID

**Request:**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query User($id: ID!) { user(id: $id) { id email } }",
    "variables": {
      "id": "invalid-uuid"
    }
  }'
```

**Error Response:**

```json
{
  "errors": [
    {
      "message": "Invalid UUID format",
      "extensions": {
        "code": "BAD_USER_INPUT"
      }
    }
  ]
}
```

---

## Complete Workflow Example

Here's a complete workflow from registration to querying data:

```bash
#!/bin/bash

# 1. Register a new user
echo "1. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Register($input: RegisterInput!) { register(input: $input) { token user { id email role } } }",
    "variables": {
      "input": {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "password": "SecurePassword123!"
      }
    }
  }')

echo "$REGISTER_RESPONSE" | jq .

# 2. Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.register.token')
echo "Token: ${TOKEN:0:50}..."

# 3. Query current user
echo -e "\n2. Querying current user..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { me { id email firstName lastName role } }"
  }' | jq .

# 4. List all users
echo -e "\n3. Listing all users..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { users(pagination: {page: 1, limit: 5}) { data { id email firstName lastName role } pagination { total } } }"
  }' | jq .

# 5. List documents
echo -e "\n4. Listing documents..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { documents(pagination: {page: 1, limit: 5}) { data { id title version status } pagination { total } } }"
  }' | jq .

echo -e "\n✓ Workflow complete!"
```

---

## GraphQL Introspection

### Get Full Schema

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ __schema { types { name kind description fields { name type { name kind } } } } }"
  }' | jq .
```

### Get Specific Type

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ __type(name: \"User\") { name kind fields { name type { name kind } } } }"
  }' | jq .
```

---

## Notes

1. **Authorization Header Format:**

   ```
   Authorization: Bearer <JWT_TOKEN>
   ```

2. **Pagination Default Values:**
   - Default page: 1
   - Default limit: 10
   - Maximum limit: 100

3. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

4. **JWT Token Expiration:**
   - Default: 7 days
   - Tokens should be stored securely on the client side

5. **Rate Limiting:**
   - Consider implementing rate limiting for production
   - Recommended: 100 requests per minute per user

---

## Additional Resources

- GraphQL Playground: http://localhost:4000/graphql (if enabled)
- API Documentation: See STEP_4_API_VALIDATION_REPORT.md
- Test Scripts: api-validation-report.js
- Health Check: http://localhost:4000/health

---

**Last Updated:** April 7, 2026

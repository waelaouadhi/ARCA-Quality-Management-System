# QMS Backend Integration Guide for Flutter Frontend

> **Version:** 1.0.0  
> **Last Updated:** April 8, 2026  
> **API Type:** GraphQL  
> **Base URL:** `http://localhost:4000/graphql`

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack Summary](#-tech-stack-summary)
3. [Recommended Flutter Packages](#-recommended-flutter-packages)
4. [Authentication Flow](#-authentication-flow)
5. [API Endpoints Summary](#-api-endpoints-summary)
6. [Data Models](#-data-models)
7. [GraphQL Operations](#-graphql-operations)
8. [Error Handling](#-error-handling)
9. [Pagination Pattern](#-pagination-pattern)
10. [Authorization & Roles](#-authorization--roles)
11. [Best Practices](#-best-practices)
12. [Quick Start Integration](#-quick-start-integration)

---

## 🎯 Project Overview

**QMS (Quality Management System)** is a comprehensive quality management backend built with modern technologies. It provides a complete API for managing:

| Module | Description |
|--------|-------------|
| **Authentication** | User registration, login, JWT-based auth |
| **Users** | User management with role-based access |
| **Documents** | Document control with versioning and status workflow |
| **Non-Conformances** | Quality issue tracking with severity levels |
| **Corrective Actions** | Action management linked to non-conformances |
| **Escalation** | SLA-based escalation system with notifications |

---

## 🔧 Tech Stack Summary

| Backend | Frontend Equivalent (Flutter) |
|---------|-------------------------------|
| **GraphQL (Apollo Server)** | `graphql_flutter` / `ferry` / `artemis` |
| **JWT Authentication** | `flutter_secure_storage` + `jwt_decoder` |
| **PostgreSQL + Prisma** | GraphQL client handles data layer |
| **Zod Validation** | Client-side validation with `formz` |
| **Winston Logging** | `logger` package for debug |

---

## 📦 Recommended Flutter Packages

### Essential Packages

```yaml
dependencies:
  # GraphQL Client (choose one)
  graphql_flutter: ^5.1.2       # Official GraphQL client with widgets
  # OR
  ferry: ^0.14.0                # Type-safe GraphQL client with code generation
  # OR
  artemis: ^7.12.0              # Code-gen GraphQL client
  
  # Authentication & Security
  flutter_secure_storage: ^9.0.0  # Secure JWT token storage
  jwt_decoder: ^2.0.1             # Decode JWT tokens
  
  # State Management (choose one)
  flutter_bloc: ^8.1.3            # BLoC pattern (recommended for large apps)
  # OR
  riverpod: ^2.4.0               # Modern state management
  # OR
  provider: ^6.1.1               # Simple state management
  
  # Network & Connectivity
  connectivity_plus: ^5.0.2      # Check network status
  dio: ^5.4.0                    # HTTP client (for REST health check)
  
  # Form Validation
  formz: ^0.7.0                  # Form validation
  
  # Local Storage
  hive: ^2.2.3                   # Fast local database
  hive_flutter: ^1.1.0           # Hive Flutter adapter
  
  # Utilities
  intl: ^0.19.0                  # Date formatting
  equatable: ^2.0.5              # Value equality
  dartz: ^0.10.1                 # Functional programming (Either, Option)
  freezed_annotation: ^2.4.1     # Immutable models
  json_annotation: ^4.8.1        # JSON serialization

dev_dependencies:
  build_runner: ^2.4.8
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  graphql_codegen: ^0.14.0       # If using graphql_flutter with codegen
```

### Why These Packages?

| Package | Reason |
|---------|--------|
| `graphql_flutter` | Native Flutter GraphQL support with caching |
| `flutter_secure_storage` | Encrypted storage for JWT tokens |
| `flutter_bloc` | Clean architecture, testable, scalable |
| `formz` | Matches Zod validation patterns from backend |
| `dartz` | Handle errors elegantly with `Either<Failure, Success>` |

---

## 🔐 Authentication Flow

### 1. Registration Flow

```dart
// GraphQL Mutation
const String registerMutation = '''
  mutation Register(\$input: RegisterInput!) {
    register(input: \$input) {
      token
      user {
        id
        email
        firstName
        lastName
        role
        createdAt
      }
    }
  }
''';

// Input model
class RegisterInput {
  final String email;
  final String password;
  final String firstName;
  final String lastName;
}
```

### 2. Login Flow

```dart
const String loginMutation = '''
  mutation Login(\$input: LoginInput!) {
    login(input: \$input) {
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
''';
```

### 3. Token Management

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

class AuthService {
  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'jwt_token';
  
  // Save token
  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }
  
  // Get token
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }
  
  // Check if token is expired
  Future<bool> isTokenValid() async {
    final token = await getToken();
    if (token == null) return false;
    return !JwtDecoder.isExpired(token);
  }
  
  // Get user from token
  Future<Map<String, dynamic>?> getCurrentUser() async {
    final token = await getToken();
    if (token == null) return null;
    return JwtDecoder.decode(token);
  }
  
  // Logout
  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
  }
}
```

### 4. GraphQL Client Setup with Auth

```dart
import 'package:graphql_flutter/graphql_flutter.dart';

class GraphQLConfig {
  static const String _endpoint = 'http://localhost:4000/graphql';
  
  static Future<GraphQLClient> getClient() async {
    final authService = AuthService();
    final token = await authService.getToken();
    
    final HttpLink httpLink = HttpLink(_endpoint);
    
    final AuthLink authLink = AuthLink(
      getToken: () async {
        final token = await authService.getToken();
        return token != null ? 'Bearer $token' : null;
      },
    );
    
    final Link link = authLink.concat(httpLink);
    
    return GraphQLClient(
      link: link,
      cache: GraphQLCache(store: HiveStore()),
    );
  }
}
```

---

## 📡 API Endpoints Summary

### Health Check (REST)

```dart
// GET http://localhost:4000/health
// Response: { "status": "ok", "timestamp": "2026-04-07T11:09:47.370Z" }

Future<bool> checkHealth() async {
  final response = await Dio().get('http://localhost:4000/health');
  return response.data['status'] == 'ok';
}
```

### GraphQL Operations

| Module | Query | Mutation |
|--------|-------|----------|
| **Auth** | `me` | `register`, `login` |
| **Users** | `users`, `user(id)` | `updateUser`, `deleteUser` |
| **Documents** | `documents`, `document(id)` | `createDocument`, `updateDocument`, `archiveDocument` |
| **Non-Conformances** | `nonConformances`, `nonConformance(id)` | `createNonConformance`, `updateNonConformance`, `closeNonConformance` |
| **Corrective Actions** | `correctiveActions`, `correctiveAction(id)` | `createCorrectiveAction`, `updateCorrectiveAction`, `completeCorrectiveAction` |

---

## 📊 Data Models

### User Model

```dart
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String email,
    required String firstName,
    required String lastName,
    required UserRole role,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _User;
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

enum UserRole { ADMIN, MANAGER, USER }
```

### Document Model

```dart
@freezed
class Document with _$Document {
  const factory Document({
    required String id,
    required String title,
    String? content,
    required int version,
    required DocStatus status,
    required String createdById,
    User? createdBy,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Document;
  
  factory Document.fromJson(Map<String, dynamic> json) => _$DocumentFromJson(json);
}

enum DocStatus { DRAFT, REVIEW, APPROVED, ARCHIVED }
```

### Non-Conformance Model

```dart
@freezed
class NonConformance with _$NonConformance {
  const factory NonConformance({
    required String id,
    required String title,
    required String description,
    required Severity severity,
    required NCStatus status,
    DateTime? dueDate,
    required String reportedById,
    User? reportedBy,
    @Default([]) List<CorrectiveAction> correctiveActions,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _NonConformance;
  
  factory NonConformance.fromJson(Map<String, dynamic> json) => 
      _$NonConformanceFromJson(json);
}

enum Severity { LOW, MEDIUM, HIGH, CRITICAL }
enum NCStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
```

### Corrective Action Model

```dart
@freezed
class CorrectiveAction with _$CorrectiveAction {
  const factory CorrectiveAction({
    required String id,
    required String action,
    required ActionStatus status,
    required String nonConformanceId,
    NonConformance? nonConformance,
    String? assignedToId,
    User? assignedTo,
    DateTime? dueDate,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _CorrectiveAction;
  
  factory CorrectiveAction.fromJson(Map<String, dynamic> json) => 
      _$CorrectiveActionFromJson(json);
}

enum ActionStatus { PENDING, IN_PROGRESS, DONE }
```

---

## 🔄 GraphQL Operations

### Complete Query Examples

#### Get Current User

```dart
const String meQuery = '''
  query Me {
    me {
      id
      email
      firstName
      lastName
      role
      createdAt
    }
  }
''';
```

#### List Users with Pagination

```dart
const String usersQuery = '''
  query Users(\$pagination: PaginationInput) {
    users(pagination: \$pagination) {
      data {
        id
        email
        firstName
        lastName
        role
        createdAt
      }
      pagination {
        page
        limit
        total
        totalPages
        hasNext
        hasPrev
      }
    }
  }
''';

// Usage
final result = await client.query(
  QueryOptions(
    document: gql(usersQuery),
    variables: {
      'pagination': {'page': 1, 'limit': 10},
    },
  ),
);
```

#### List Documents with Filter

```dart
const String documentsQuery = '''
  query Documents(\$pagination: PaginationInput, \$status: DocStatus) {
    documents(pagination: \$pagination, status: \$status) {
      data {
        id
        title
        content
        version
        status
        createdBy {
          id
          firstName
          lastName
        }
        createdAt
        updatedAt
      }
      pagination {
        page
        limit
        total
        totalPages
        hasNext
        hasPrev
      }
    }
  }
''';
```

#### List Non-Conformances with Filters

```dart
const String nonConformancesQuery = '''
  query NonConformances(
    \$pagination: PaginationInput
    \$status: NCStatus
    \$severity: Severity
    \$reportedById: String
  ) {
    nonConformances(
      pagination: \$pagination
      status: \$status
      severity: \$severity
      reportedById: \$reportedById
    ) {
      data {
        id
        title
        description
        severity
        status
        reportedBy {
          id
          firstName
          lastName
        }
        correctiveActions {
          id
          action
          status
        }
        createdAt
      }
      pagination {
        total
        hasNext
        hasPrev
      }
    }
  }
''';
```

#### List Corrective Actions

```dart
const String correctiveActionsQuery = '''
  query CorrectiveActions(
    \$pagination: PaginationInput
    \$status: ActionStatus
    \$nonConformanceId: String
    \$assignedToId: String
  ) {
    correctiveActions(
      pagination: \$pagination
      status: \$status
      nonConformanceId: \$nonConformanceId
      assignedToId: \$assignedToId
    ) {
      data {
        id
        action
        status
        dueDate
        assignedTo {
          id
          firstName
          lastName
        }
        nonConformance {
          id
          title
        }
        createdAt
      }
      pagination {
        total
        hasNext
      }
    }
  }
''';
```

### Mutation Examples

#### Create Document

```dart
const String createDocumentMutation = '''
  mutation CreateDocument(\$input: CreateDocumentInput!) {
    createDocument(input: \$input) {
      id
      title
      content
      version
      status
      createdAt
    }
  }
''';

// Usage
final result = await client.mutate(
  MutationOptions(
    document: gql(createDocumentMutation),
    variables: {
      'input': {
        'title': 'Quality Manual v2',
        'content': 'Document content here...',
      },
    },
  ),
);
```

#### Create Non-Conformance

```dart
const String createNonConformanceMutation = '''
  mutation CreateNonConformance(\$input: CreateNonConformanceInput!) {
    createNonConformance(input: \$input) {
      id
      title
      description
      severity
      status
      createdAt
    }
  }
''';

// Usage
final result = await client.mutate(
  MutationOptions(
    document: gql(createNonConformanceMutation),
    variables: {
      'input': {
        'title': 'Equipment Calibration Overdue',
        'description': 'Equipment X123 has exceeded calibration due date',
        'severity': 'HIGH',
      },
    },
  ),
);
```

#### Create Corrective Action

```dart
const String createCorrectiveActionMutation = '''
  mutation CreateCorrectiveAction(\$input: CreateCorrectiveActionInput!) {
    createCorrectiveAction(input: \$input) {
      id
      action
      status
      dueDate
      assignedTo {
        id
        firstName
        lastName
      }
      createdAt
    }
  }
''';

// Usage
final result = await client.mutate(
  MutationOptions(
    document: gql(createCorrectiveActionMutation),
    variables: {
      'input': {
        'action': 'Recalibrate equipment X123',
        'nonConformanceId': 'cmnoiowm70007s7wwwmi4i5wl',
        'assignedToId': 'user-id-here',
        'dueDate': '2026-04-15T00:00:00Z',
      },
    },
  ),
);
```

#### Update Status Mutations

```dart
// Close Non-Conformance
const String closeNCMutation = '''
  mutation CloseNC(\$id: ID!) {
    closeNonConformance(id: \$id) {
      id
      status
      updatedAt
    }
  }
''';

// Complete Corrective Action
const String completeCAMutation = '''
  mutation CompleteCA(\$id: ID!) {
    completeCorrectiveAction(id: \$id) {
      id
      status
      updatedAt
    }
  }
''';

// Archive Document
const String archiveDocMutation = '''
  mutation ArchiveDoc(\$id: ID!) {
    archiveDocument(id: \$id) {
      id
      status
      updatedAt
    }
  }
''';
```

---

## ⚠️ Error Handling

### Error Response Structure

```json
{
  "errors": [
    {
      "message": "Error message here",
      "extensions": {
        "code": "ERROR_CODE"
      }
    }
  ]
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHENTICATED` | Missing or invalid token | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `BAD_USER_INPUT` | Validation error | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `INTERNAL_SERVER_ERROR` | Server error | 500 |

### Flutter Error Handling

```dart
import 'package:dartz/dartz.dart';

abstract class Failure {
  final String message;
  const Failure(this.message);
}

class AuthenticationFailure extends Failure {
  const AuthenticationFailure([String message = 'Not authenticated']) 
      : super(message);
}

class AuthorizationFailure extends Failure {
  const AuthorizationFailure([String message = 'Insufficient permissions']) 
      : super(message);
}

class ValidationFailure extends Failure {
  const ValidationFailure(String message) : super(message);
}

class NotFoundFailure extends Failure {
  const NotFoundFailure([String message = 'Resource not found']) 
      : super(message);
}

class ServerFailure extends Failure {
  const ServerFailure([String message = 'Server error occurred']) 
      : super(message);
}

// Helper function to parse GraphQL errors
Either<Failure, T> parseGraphQLResult<T>(QueryResult result, T Function(Map<String, dynamic>) parser) {
  if (result.hasException) {
    final errors = result.exception?.graphqlErrors ?? [];
    if (errors.isNotEmpty) {
      final code = errors.first.extensions?['code'];
      final message = errors.first.message;
      
      switch (code) {
        case 'UNAUTHENTICATED':
          return Left(AuthenticationFailure(message));
        case 'FORBIDDEN':
          return Left(AuthorizationFailure(message));
        case 'BAD_USER_INPUT':
          return Left(ValidationFailure(message));
        case 'NOT_FOUND':
          return Left(NotFoundFailure(message));
        default:
          return Left(ServerFailure(message));
      }
    }
    return Left(ServerFailure());
  }
  
  return Right(parser(result.data!));
}
```

---

## 📄 Pagination Pattern

### Pagination Input

```dart
class PaginationInput {
  final int page;
  final int limit;
  
  const PaginationInput({
    this.page = 1,
    this.limit = 10,
  });
  
  Map<String, dynamic> toJson() => {
    'page': page,
    'limit': limit,
  };
}
```

### Pagination Response

```dart
@freezed
class PaginationInfo with _$PaginationInfo {
  const factory PaginationInfo({
    required int page,
    required int limit,
    required int total,
    required int totalPages,
    required bool hasNext,
    required bool hasPrev,
  }) = _PaginationInfo;
  
  factory PaginationInfo.fromJson(Map<String, dynamic> json) => 
      _$PaginationInfoFromJson(json);
}

@freezed
class PaginatedList<T> with _$PaginatedList<T> {
  const factory PaginatedList({
    required List<T> data,
    required PaginationInfo pagination,
  }) = _PaginatedList<T>;
}
```

### Pagination Widget Example

```dart
class PaginatedListView<T> extends StatefulWidget {
  final Future<PaginatedList<T>> Function(int page) fetchData;
  final Widget Function(T item) itemBuilder;
  
  const PaginatedListView({
    required this.fetchData,
    required this.itemBuilder,
  });
  
  @override
  _PaginatedListViewState<T> createState() => _PaginatedListViewState<T>();
}

class _PaginatedListViewState<T> extends State<PaginatedListView<T>> {
  final List<T> _items = [];
  int _currentPage = 1;
  bool _hasMore = true;
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadMore();
  }
  
  Future<void> _loadMore() async {
    if (_isLoading || !_hasMore) return;
    
    setState(() => _isLoading = true);
    
    final result = await widget.fetchData(_currentPage);
    
    setState(() {
      _items.addAll(result.data);
      _hasMore = result.pagination.hasNext;
      _currentPage++;
      _isLoading = false;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: _items.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index >= _items.length) {
          _loadMore();
          return const CircularProgressIndicator();
        }
        return widget.itemBuilder(_items[index]);
      },
    );
  }
}
```

---

## 🔒 Authorization & Roles

### Role Hierarchy

```
ADMIN (Full Access)
  ├── Create/Read/Update/Delete all resources
  └── Manage users and roles

MANAGER (Extended Access)
  ├── Create/Read/Update most resources
  ├── Cannot delete resources (except own)
  └── Cannot manage user roles

USER (Basic Access)
  ├── Read most resources
  ├── Create Non-Conformances
  ├── Update own resources
  └── Update assigned Corrective Actions
```

### Permission Matrix

| Resource | Action | ADMIN | MANAGER | USER |
|----------|--------|-------|---------|------|
| **User** | Create | ✅ | ❌ | ❌ |
| **User** | Read | ✅ | ✅ | ❌ |
| **User** | Update | ✅ | ❌ | Self only |
| **User** | Delete | ✅ | ❌ | ❌ |
| **Document** | Create | ✅ | ✅ | ❌ |
| **Document** | Read | ✅ | ✅ | ✅ |
| **Document** | Update | ✅ | ✅ | Creator only |
| **Document** | Delete | ✅ | ❌ | ❌ |
| **NonConformance** | Create | ✅ | ✅ | ✅ |
| **NonConformance** | Read | ✅ | ✅ | ✅ |
| **NonConformance** | Update | ✅ | ✅ | Reporter only |
| **NonConformance** | Delete | ✅ | ❌ | ❌ |
| **CorrectiveAction** | Create | ✅ | ✅ | ❌ |
| **CorrectiveAction** | Read | ✅ | ✅ | ✅ |
| **CorrectiveAction** | Update | ✅ | ✅ | Assignee only |
| **CorrectiveAction** | Delete | ✅ | ❌ | ❌ |

### Role-Based UI Helper

```dart
class RolePermissions {
  static bool canCreateDocument(UserRole role) {
    return role == UserRole.ADMIN || role == UserRole.MANAGER;
  }
  
  static bool canDeleteResource(UserRole role) {
    return role == UserRole.ADMIN;
  }
  
  static bool canManageUsers(UserRole role) {
    return role == UserRole.ADMIN;
  }
  
  static bool canUpdateNonConformance(UserRole role, String userId, String reporterId) {
    if (role == UserRole.ADMIN || role == UserRole.MANAGER) return true;
    return userId == reporterId;
  }
  
  static bool canUpdateCorrectiveAction(UserRole role, String userId, String? assigneeId) {
    if (role == UserRole.ADMIN || role == UserRole.MANAGER) return true;
    return userId == assigneeId;
  }
}

// Widget usage
if (RolePermissions.canCreateDocument(currentUser.role)) {
  // Show create button
}
```

---

## ✅ Best Practices

### 1. Token Refresh Strategy

```dart
class TokenInterceptor extends Interceptor {
  final AuthService _authService;
  
  TokenInterceptor(this._authService);
  
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (await _authService.isTokenValid()) {
      final token = await _authService.getToken();
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
  
  @override
  void onError(DioError err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired - redirect to login
      await _authService.logout();
      // Navigate to login screen
    }
    handler.next(err);
  }
}
```

### 2. Offline Support with Caching

```dart
// GraphQL cache configuration
final cache = GraphQLCache(
  store: HiveStore(),
  typePolicies: {
    'User': TypePolicy(
      keyFields: {'id': true},
    ),
    'Document': TypePolicy(
      keyFields: {'id': true},
    ),
    'NonConformance': TypePolicy(
      keyFields: {'id': true},
    ),
    'CorrectiveAction': TypePolicy(
      keyFields: {'id': true},
    ),
  },
);

// Fetch policy
final result = await client.query(
  QueryOptions(
    document: gql(query),
    fetchPolicy: FetchPolicy.cacheAndNetwork, // Show cached, then update
  ),
);
```

### 3. Input Validation (Client-Side)

```dart
// Match backend password requirements
class PasswordValidator {
  static String? validate(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain uppercase letter';
    }
    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Password must contain lowercase letter';
    }
    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Password must contain a number';
    }
    if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(value)) {
      return 'Password must contain a special character';
    }
    return null;
  }
}

// Email validation
class EmailValidator {
  static String? validate(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Invalid email format';
    }
    return null;
  }
}
```

### 4. Date/Time Handling

```dart
// Backend uses ISO 8601 format
// Convert DateTime to string for mutations
String formatForBackend(DateTime date) {
  return date.toUtc().toIso8601String();
}

// Parse from backend response
DateTime parseFromBackend(String dateString) {
  return DateTime.parse(dateString).toLocal();
}
```

### 5. ID Format

```dart
// Backend uses CUID format (25 lowercase alphanumeric characters)
// Example: cmnoiowm70007s7wwwmi4i5wl

bool isValidId(String id) {
  return RegExp(r'^[a-z0-9]{25}$').hasMatch(id);
}
```

---

## 🚀 Quick Start Integration

### Step 1: Setup Project

```bash
flutter create qms_app
cd qms_app
```

### Step 2: Add Dependencies

Add the packages from the recommended list to `pubspec.yaml`.

### Step 3: Create API Client

```dart
// lib/core/api/graphql_client.dart
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';

class ApiClient {
  static GraphQLClient? _client;
  static const String _endpoint = 'http://localhost:4000/graphql';
  
  static Future<void> init() async {
    await Hive.initFlutter();
    await initHiveForFlutter();
  }
  
  static GraphQLClient get client {
    if (_client == null) {
      throw Exception('ApiClient not initialized. Call init() first.');
    }
    return _client!;
  }
  
  static void setToken(String? token) {
    final httpLink = HttpLink(_endpoint);
    
    final authLink = AuthLink(
      getToken: () => token != null ? 'Bearer $token' : null,
    );
    
    _client = GraphQLClient(
      link: authLink.concat(httpLink),
      cache: GraphQLCache(store: HiveStore()),
    );
  }
}
```

### Step 4: Create Repository

```dart
// lib/features/auth/data/auth_repository.dart
class AuthRepository {
  final GraphQLClient _client;
  
  AuthRepository(this._client);
  
  Future<Either<Failure, AuthResponse>> login(String email, String password) async {
    final result = await _client.mutate(
      MutationOptions(
        document: gql(loginMutation),
        variables: {
          'input': {'email': email, 'password': password},
        },
      ),
    );
    
    return parseGraphQLResult(
      result,
      (data) => AuthResponse.fromJson(data['login']),
    );
  }
  
  Future<Either<Failure, AuthResponse>> register(RegisterInput input) async {
    final result = await _client.mutate(
      MutationOptions(
        document: gql(registerMutation),
        variables: {'input': input.toJson()},
      ),
    );
    
    return parseGraphQLResult(
      result,
      (data) => AuthResponse.fromJson(data['register']),
    );
  }
}
```

### Step 5: Create BLoC

```dart
// lib/features/auth/bloc/auth_bloc.dart
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _repository;
  final AuthService _authService;
  
  AuthBloc(this._repository, this._authService) : super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<CheckAuthStatus>(_onCheckAuthStatus);
  }
  
  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    final result = await _repository.login(event.email, event.password);
    
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (response) async {
        await _authService.saveToken(response.token);
        ApiClient.setToken(response.token);
        emit(Authenticated(response.user));
      },
    );
  }
}
```

---

## 📞 Support & Resources

| Resource | URL |
|----------|-----|
| **GraphQL Playground** | http://localhost:4000/graphql |
| **Health Check** | http://localhost:4000/health |
| **API Examples** | See `docs/24_API_EXAMPLES.md` |
| **Schema Introspection** | Use GraphQL playground to explore |

### GraphQL Introspection Query

```dart
const String introspectionQuery = '''
  {
    __schema {
      types {
        name
        kind
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  }
''';
```

---

## 🎯 Summary Checklist

- [ ] Install recommended Flutter packages
- [ ] Setup GraphQL client with auth
- [ ] Implement secure token storage
- [ ] Create data models matching backend
- [ ] Implement error handling with `Either`
- [ ] Add pagination support
- [ ] Implement role-based UI permissions
- [ ] Add client-side validation matching backend
- [ ] Setup offline caching
- [ ] Test all CRUD operations

---

**Happy Coding! 🚀**

*This documentation is auto-generated based on the QMS Backend codebase.*

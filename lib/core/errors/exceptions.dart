/// Base exception class for data layer errors
/// All data layer exceptions extend this class
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;
  final StackTrace? stackTrace;

  const AppException({
    required this.message,
    this.code,
    this.originalError,
    this.stackTrace,
  });

  @override
  String toString() => 'AppException: $message (code: $code)';
}

// ============================================================================
// Authentication Exceptions
// ============================================================================

/// Exception when user is not authenticated
class AuthenticationException extends AppException {
  const AuthenticationException({
    super.message = 'User is not authenticated',
    super.code = 'UNAUTHENTICATED',
    super.originalError,
    super.stackTrace,
  });
}

/// Exception when credentials are invalid
class InvalidCredentialsException extends AppException {
  const InvalidCredentialsException({
    super.message = 'Invalid email or password',
    super.code = 'INVALID_CREDENTIALS',
    super.originalError,
    super.stackTrace,
  });
}

/// Exception when token is expired
class TokenExpiredException extends AppException {
  const TokenExpiredException({
    super.message = 'Token has expired',
    super.code = 'TOKEN_EXPIRED',
    super.originalError,
    super.stackTrace,
  });
}

// ============================================================================
// Authorization Exceptions
// ============================================================================

/// Exception when user lacks permission
class PermissionException extends AppException {
  const PermissionException({
    super.message = 'Permission denied',
    super.code = 'FORBIDDEN',
    super.originalError,
    super.stackTrace,
  });
}

// ============================================================================
// Validation Exceptions
// ============================================================================

/// Exception for invalid input data
class ValidationException extends AppException {
  final Map<String, List<String>>? fieldErrors;

  const ValidationException({
    super.message = 'Invalid input data',
    super.code = 'BAD_USER_INPUT',
    super.originalError,
    super.stackTrace,
    this.fieldErrors,
  });
}

// ============================================================================
// Resource Exceptions
// ============================================================================

/// Exception when resource is not found
class NotFoundException extends AppException {
  final String? resourceType;
  final String? resourceId;

  const NotFoundException({
    super.message = 'Resource not found',
    super.code = 'NOT_FOUND',
    super.originalError,
    super.stackTrace,
    this.resourceType,
    this.resourceId,
  });
}

/// Exception when resource already exists
class ConflictException extends AppException {
  const ConflictException({
    super.message = 'Resource already exists',
    super.code = 'CONFLICT',
    super.originalError,
    super.stackTrace,
  });
}

// ============================================================================
// Server Exceptions
// ============================================================================

/// Exception for internal server errors
class ServerException extends AppException {
  const ServerException({
    super.message = 'Internal server error',
    super.code = 'INTERNAL_SERVER_ERROR',
    super.originalError,
    super.stackTrace,
  });
}

/// Exception when server is unavailable
class ServiceUnavailableException extends AppException {
  const ServiceUnavailableException({
    super.message = 'Service unavailable',
    super.code = 'SERVICE_UNAVAILABLE',
    super.originalError,
    super.stackTrace,
  });
}

// ============================================================================
// Network Exceptions
// ============================================================================

/// Exception for network connectivity issues
class NetworkException extends AppException {
  const NetworkException({
    super.message = 'No internet connection',
    super.code = 'NETWORK_ERROR',
    super.originalError,
    super.stackTrace,
  });
}

/// Exception for connection timeout
class TimeoutException extends AppException {
  const TimeoutException({
    super.message = 'Connection timed out',
    super.code = 'TIMEOUT',
    super.originalError,
    super.stackTrace,
  });
}

// ============================================================================
// Cache Exceptions
// ============================================================================

/// Exception when cache operation fails
class CacheException extends AppException {
  const CacheException({
    super.message = 'Cache operation failed',
    super.code = 'CACHE_ERROR',
    super.originalError,
    super.stackTrace,
  });
}

// ============================================================================
// GraphQL Exceptions
// ============================================================================

/// Exception for GraphQL-specific errors
class GraphQLException extends AppException {
  final List<GraphQLError>? errors;

  const GraphQLException({
    super.message = 'GraphQL error',
    super.code = 'GRAPHQL_ERROR',
    super.originalError,
    super.stackTrace,
    this.errors,
  });
}

/// Represents a single GraphQL error
class GraphQLError {
  final String message;
  final String? code;
  final List<String>? path;
  final Map<String, dynamic>? extensions;

  const GraphQLError({
    required this.message,
    this.code,
    this.path,
    this.extensions,
  });

  factory GraphQLError.fromJson(Map<String, dynamic> json) {
    return GraphQLError(
      message: json['message'] as String? ?? 'Unknown error',
      code: json['extensions']?['code'] as String?,
      path: (json['path'] as List?)?.map((e) => e.toString()).toList(),
      extensions: json['extensions'] as Map<String, dynamic>?,
    );
  }
}

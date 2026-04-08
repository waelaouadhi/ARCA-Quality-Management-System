import 'package:equatable/equatable.dart';

/// Base failure class for domain layer errors
/// All domain failures extend this class
abstract class Failure extends Equatable {
  final String message;
  final String? code;
  final dynamic originalError;

  const Failure({
    required this.message,
    this.code,
    this.originalError,
  });

  @override
  List<Object?> get props => [message, code];

  /// User-friendly message for UI display
  String get userMessage => message;
}

// ============================================================================
// Authentication Failures
// ============================================================================

/// Failure when user is not authenticated
/// Maps to GraphQL UNAUTHENTICATED error
class AuthenticationFailure extends Failure {
  const AuthenticationFailure({
    super.message = 'You are not authenticated. Please log in.',
    super.code = 'UNAUTHENTICATED',
    super.originalError,
  });

  @override
  String get userMessage => 'Session expired. Please log in again.';
}

/// Failure when credentials are invalid
class InvalidCredentialsFailure extends Failure {
  const InvalidCredentialsFailure({
    super.message = 'Invalid email or password',
    super.code = 'INVALID_CREDENTIALS',
    super.originalError,
  });
}

/// Failure when token is expired
class TokenExpiredFailure extends Failure {
  const TokenExpiredFailure({
    super.message = 'Your session has expired',
    super.code = 'TOKEN_EXPIRED',
    super.originalError,
  });

  @override
  String get userMessage => 'Session expired. Please log in again.';
}

// ============================================================================
// Authorization Failures
// ============================================================================

/// Failure when user lacks permission
/// Maps to GraphQL FORBIDDEN error
class PermissionFailure extends Failure {
  const PermissionFailure({
    super.message = 'You do not have permission to perform this action',
    super.code = 'FORBIDDEN',
    super.originalError,
  });

  @override
  String get userMessage => 'Access denied. You don\'t have permission.';
}

/// Failure when role is insufficient
class InsufficientRoleFailure extends Failure {
  final String requiredRole;

  const InsufficientRoleFailure({
    required this.requiredRole,
    super.message = 'Insufficient role',
    super.code = 'INSUFFICIENT_ROLE',
    super.originalError,
  });

  @override
  String get userMessage => 'This action requires $requiredRole role.';

  @override
  List<Object?> get props => [...super.props, requiredRole];
}

// ============================================================================
// Validation Failures
// ============================================================================

/// Failure for invalid user input
/// Maps to GraphQL BAD_USER_INPUT error
class ValidationFailure extends Failure {
  final Map<String, List<String>>? fieldErrors;

  const ValidationFailure({
    super.message = 'Invalid input data',
    super.code = 'BAD_USER_INPUT',
    super.originalError,
    this.fieldErrors,
  });

  @override
  String get userMessage {
    if (fieldErrors != null && fieldErrors!.isNotEmpty) {
      final firstField = fieldErrors!.entries.first;
      return '${firstField.key}: ${firstField.value.first}';
    }
    return message;
  }

  @override
  List<Object?> get props => [...super.props, fieldErrors];
}

// ============================================================================
// Resource Failures
// ============================================================================

/// Failure when resource is not found
/// Maps to GraphQL NOT_FOUND error
class NotFoundFailure extends Failure {
  final String? resourceType;
  final String? resourceId;

  const NotFoundFailure({
    super.message = 'Resource not found',
    super.code = 'NOT_FOUND',
    super.originalError,
    this.resourceType,
    this.resourceId,
  });

  @override
  String get userMessage {
    if (resourceType != null) {
      return '$resourceType not found';
    }
    return 'The requested item was not found.';
  }

  @override
  List<Object?> get props => [...super.props, resourceType, resourceId];
}

/// Failure when resource already exists
class ConflictFailure extends Failure {
  const ConflictFailure({
    super.message = 'Resource already exists',
    super.code = 'CONFLICT',
    super.originalError,
  });

  @override
  String get userMessage => 'This item already exists.';
}

// ============================================================================
// Server Failures
// ============================================================================

/// Failure for internal server errors
/// Maps to GraphQL INTERNAL_SERVER_ERROR
class ServerFailure extends Failure {
  const ServerFailure({
    super.message = 'An unexpected server error occurred',
    super.code = 'INTERNAL_SERVER_ERROR',
    super.originalError,
  });

  @override
  String get userMessage => 'Something went wrong. Please try again later.';
}

/// Failure when server is unavailable
class ServiceUnavailableFailure extends Failure {
  const ServiceUnavailableFailure({
    super.message = 'Service is temporarily unavailable',
    super.code = 'SERVICE_UNAVAILABLE',
    super.originalError,
  });

  @override
  String get userMessage => 'Service is temporarily unavailable. Please try again.';
}

// ============================================================================
// Network Failures
// ============================================================================

/// Failure for network connectivity issues
class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection',
    super.code = 'NETWORK_ERROR',
    super.originalError,
  });

  @override
  String get userMessage => 'Please check your internet connection.';
}

/// Failure for connection timeout
class TimeoutFailure extends Failure {
  const TimeoutFailure({
    super.message = 'Connection timed out',
    super.code = 'TIMEOUT',
    super.originalError,
  });

  @override
  String get userMessage => 'Connection timed out. Please try again.';
}

// ============================================================================
// Cache Failures
// ============================================================================

/// Failure when cached data is not available
class CacheFailure extends Failure {
  const CacheFailure({
    super.message = 'Failed to load cached data',
    super.code = 'CACHE_ERROR',
    super.originalError,
  });

  @override
  String get userMessage => 'Failed to load offline data.';
}

// ============================================================================
// Unknown Failures
// ============================================================================

/// Failure for unexpected errors
class UnknownFailure extends Failure {
  const UnknownFailure({
    super.message = 'An unexpected error occurred',
    super.code = 'UNKNOWN',
    super.originalError,
  });

  @override
  String get userMessage => 'An unexpected error occurred. Please try again.';
}

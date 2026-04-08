import 'dart:io';
import 'package:dio/dio.dart';
import 'package:graphql_flutter/graphql_flutter.dart' as gql;
import 'package:logger/logger.dart';

import 'exceptions.dart';
import 'failures.dart';

/// Centralized error handler for converting exceptions to failures
class ErrorHandler {
  static final Logger _logger = Logger(
    printer: PrettyPrinter(
      methodCount: 0,
      errorMethodCount: 5,
      lineLength: 50,
      colors: true,
      printEmojis: true,
    ),
  );

  /// Convert any exception to a domain Failure
  static Failure handleException(dynamic error, [StackTrace? stackTrace]) {
    _logError(error, stackTrace);

    if (error is Failure) {
      return error;
    }

    if (error is AppException) {
      return _mapExceptionToFailure(error);
    }

    if (error is gql.OperationException) {
      return _handleGraphQLException(error);
    }

    if (error is DioException) {
      return _handleDioException(error);
    }

    if (error is SocketException) {
      return const NetworkFailure();
    }

    if (error is FormatException) {
      return ValidationFailure(
        message: 'Invalid data format: ${error.message}',
      );
    }

    return UnknownFailure(
      message: error.toString(),
      originalError: error,
    );
  }

  /// Map AppException to Failure
  static Failure _mapExceptionToFailure(AppException exception) {
    return switch (exception) {
      AuthenticationException() => AuthenticationFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      InvalidCredentialsException() => InvalidCredentialsFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      TokenExpiredException() => TokenExpiredFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      PermissionException() => PermissionFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      ValidationException e => ValidationFailure(
          message: e.message,
          fieldErrors: e.fieldErrors,
          originalError: e.originalError,
        ),
      NotFoundException e => NotFoundFailure(
          message: e.message,
          resourceType: e.resourceType,
          resourceId: e.resourceId,
          originalError: e.originalError,
        ),
      ConflictException() => ConflictFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      ServerException() => ServerFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      ServiceUnavailableException() => ServiceUnavailableFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      NetworkException() => NetworkFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      TimeoutException() => TimeoutFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      CacheException() => CacheFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
      GraphQLException e => _handleGraphQLErrors(e.errors),
      _ => UnknownFailure(
          message: exception.message,
          originalError: exception.originalError,
        ),
    };
  }

  /// Handle GraphQL OperationException
  static Failure _handleGraphQLException(gql.OperationException exception) {
    // Check for link exception (network errors)
    if (exception.linkException != null) {
      final linkException = exception.linkException;

      if (linkException is gql.ServerException) {
        return ServerFailure(
          message: linkException.originalException?.toString() ?? 'Server error',
          originalError: linkException,
        );
      }

      if (linkException is gql.NetworkException) {
        return NetworkFailure(
          message: linkException.message ?? 'Network error',
          originalError: linkException,
        );
      }

      // Generic link exception
      return NetworkFailure(
        message: linkException.toString(),
        originalError: linkException,
      );
    }

    // Handle GraphQL errors
    if (exception.graphqlErrors.isNotEmpty) {
      return _mapGraphQLErrorToFailure(exception.graphqlErrors.first);
    }

    return ServerFailure(originalError: exception);
  }

  /// Map GraphQL error to Failure based on error code
  static Failure _mapGraphQLErrorToFailure(gql.GraphQLError error) {
    final code = error.extensions?['code'] as String?;
    final message = error.message;

    return switch (code) {
      'UNAUTHENTICATED' => AuthenticationFailure(
          message: message,
          code: code,
        ),
      'FORBIDDEN' => PermissionFailure(
          message: message,
          code: code,
        ),
      'BAD_USER_INPUT' => ValidationFailure(
          message: message,
          code: code,
          fieldErrors: _extractFieldErrors(error.extensions),
        ),
      'NOT_FOUND' => NotFoundFailure(
          message: message,
          code: code,
        ),
      'INTERNAL_SERVER_ERROR' => ServerFailure(
          message: message,
          code: code,
        ),
      _ => ServerFailure(
          message: message,
          code: code ?? 'UNKNOWN',
        ),
    };
  }

  /// Handle GraphQL errors list
  static Failure _handleGraphQLErrors(List<GraphQLError>? errors) {
    if (errors == null || errors.isEmpty) {
      return const ServerFailure();
    }

    final error = errors.first;
    final code = error.code;

    return switch (code) {
      'UNAUTHENTICATED' => AuthenticationFailure(message: error.message),
      'FORBIDDEN' => PermissionFailure(message: error.message),
      'BAD_USER_INPUT' => ValidationFailure(message: error.message),
      'NOT_FOUND' => NotFoundFailure(message: error.message),
      'INTERNAL_SERVER_ERROR' => ServerFailure(message: error.message),
      _ => ServerFailure(message: error.message),
    };
  }

  /// Handle Dio HTTP exceptions
  static Failure _handleDioException(DioException exception) {
    switch (exception.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return TimeoutFailure(originalError: exception);

      case DioExceptionType.connectionError:
        return NetworkFailure(originalError: exception);

      case DioExceptionType.badResponse:
        return _handleHttpStatusCode(
          exception.response?.statusCode,
          exception.response?.data,
          exception,
        );

      case DioExceptionType.cancel:
        return const UnknownFailure(
          message: 'Request was cancelled',
          code: 'CANCELLED',
        );

      case DioExceptionType.badCertificate:
        return const NetworkFailure(
          message: 'Invalid SSL certificate',
          code: 'BAD_CERTIFICATE',
        );

      case DioExceptionType.unknown:
        if (exception.error is SocketException) {
          return const NetworkFailure();
        }
        return UnknownFailure(
          message: exception.message ?? 'Unknown error',
          originalError: exception,
        );
    }
  }

  /// Map HTTP status codes to Failures
  static Failure _handleHttpStatusCode(
    int? statusCode,
    dynamic responseData,
    DioException exception,
  ) {
    final message = _extractErrorMessage(responseData) ?? 'Request failed';

    return switch (statusCode) {
      400 => ValidationFailure(message: message, originalError: exception),
      401 => AuthenticationFailure(message: message, originalError: exception),
      403 => PermissionFailure(message: message, originalError: exception),
      404 => NotFoundFailure(message: message, originalError: exception),
      409 => ConflictFailure(message: message, originalError: exception),
      422 => ValidationFailure(message: message, originalError: exception),
      429 => const ServiceUnavailableFailure(
          message: 'Too many requests. Please try again later.',
        ),
      500 => ServerFailure(message: message, originalError: exception),
      502 || 503 || 504 => ServiceUnavailableFailure(
          message: message,
          originalError: exception,
        ),
      _ => ServerFailure(message: message, originalError: exception),
    };
  }

  /// Extract error message from response data
  static String? _extractErrorMessage(dynamic data) {
    if (data == null) return null;

    if (data is String) return data;

    if (data is Map<String, dynamic>) {
      return data['message'] as String? ??
          data['error'] as String? ??
          data['errors']?.toString();
    }

    return data.toString();
  }

  /// Extract field errors from GraphQL extensions
  static Map<String, List<String>>? _extractFieldErrors(
    Map<String, dynamic>? extensions,
  ) {
    if (extensions == null) return null;

    final validationErrors = extensions['validationErrors'];
    if (validationErrors is Map<String, dynamic>) {
      return validationErrors.map((key, value) {
        if (value is List) {
          return MapEntry(key, value.map((e) => e.toString()).toList());
        }
        return MapEntry(key, [value.toString()]);
      });
    }

    return null;
  }

  /// Log error for debugging
  static void _logError(dynamic error, StackTrace? stackTrace) {
    if (error is Failure) {
      _logger.w('Failure: ${error.message} (${error.code})');
    } else if (error is AppException) {
      _logger.e('Exception: ${error.message}', error: error, stackTrace: stackTrace);
    } else if (error is gql.OperationException) {
      _logger.e('GraphQL Error: ${error.toString()}', error: error, stackTrace: stackTrace);
    } else if (error is DioException) {
      _logger.e('HTTP Error: ${error.message}', error: error, stackTrace: stackTrace);
    } else {
      _logger.e('Unknown Error: $error', error: error, stackTrace: stackTrace);
    }
  }
}

/// Extension for Result type pattern
extension ResultExtension<T> on Future<T> {
  /// Convert Future to Result handling errors
  Future<Result<T>> toResult() async {
    try {
      final data = await this;
      return Result.success(data);
    } catch (e, stackTrace) {
      return Result.failure(ErrorHandler.handleException(e, stackTrace));
    }
  }
}

/// Simple Result type for error handling
sealed class Result<T> {
  const Result._();

  factory Result.success(T data) = Success<T>;
  factory Result.failure(Failure failure) = Failed<T>;

  R fold<R>(
    R Function(Failure failure) onFailure,
    R Function(T data) onSuccess,
  );

  bool get isSuccess;
  bool get isFailure;
}

class Success<T> extends Result<T> {
  final T data;

  const Success(this.data) : super._();

  @override
  R fold<R>(
    R Function(Failure failure) onFailure,
    R Function(T data) onSuccess,
  ) {
    return onSuccess(data);
  }

  @override
  bool get isSuccess => true;

  @override
  bool get isFailure => false;
}

class Failed<T> extends Result<T> {
  final Failure failure;

  const Failed(this.failure) : super._();

  @override
  R fold<R>(
    R Function(Failure failure) onFailure,
    R Function(T data) onSuccess,
  ) {
    return onFailure(failure);
  }

  @override
  bool get isSuccess => false;

  @override
  bool get isFailure => true;
}

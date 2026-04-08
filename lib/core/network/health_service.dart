import 'package:dio/dio.dart';
import 'package:equatable/equatable.dart';
import 'package:logger/logger.dart';

import '../../config/environment/environment.dart';

/// Health check status
enum HealthStatus {
  healthy,
  unhealthy,
  unknown,
}

/// Health check result
class HealthCheckResult extends Equatable {
  final HealthStatus status;
  final String? message;
  final DateTime timestamp;
  final Duration? responseTime;
  final Map<String, dynamic>? details;

  const HealthCheckResult({
    required this.status,
    this.message,
    required this.timestamp,
    this.responseTime,
    this.details,
  });

  /// Healthy result
  factory HealthCheckResult.healthy({
    String? message,
    Duration? responseTime,
    Map<String, dynamic>? details,
  }) {
    return HealthCheckResult(
      status: HealthStatus.healthy,
      message: message ?? 'Backend is healthy',
      timestamp: DateTime.now(),
      responseTime: responseTime,
      details: details,
    );
  }

  /// Unhealthy result
  factory HealthCheckResult.unhealthy({
    String? message,
    Duration? responseTime,
    Map<String, dynamic>? details,
  }) {
    return HealthCheckResult(
      status: HealthStatus.unhealthy,
      message: message ?? 'Backend is unavailable',
      timestamp: DateTime.now(),
      responseTime: responseTime,
      details: details,
    );
  }

  /// Unknown result (when check fails)
  factory HealthCheckResult.unknown({
    String? message,
    Map<String, dynamic>? details,
  }) {
    return HealthCheckResult(
      status: HealthStatus.unknown,
      message: message ?? 'Could not determine health status',
      timestamp: DateTime.now(),
      details: details,
    );
  }

  bool get isHealthy => status == HealthStatus.healthy;
  bool get isUnhealthy => status == HealthStatus.unhealthy;
  bool get isUnknown => status == HealthStatus.unknown;

  @override
  List<Object?> get props => [
        status,
        message,
        timestamp,
        responseTime,
        details,
      ];
}

/// Service for checking backend health
class HealthCheckService {
  final Dio _dio;
  final Logger _logger;
  final Duration _timeout;

  HealthCheckService({
    Dio? dio,
    Logger? logger,
    Duration? timeout,
  })  : _dio = dio ?? Dio(),
        _logger = logger ?? Logger(),
        _timeout = timeout ?? const Duration(seconds: 10);

  /// Check backend health
  Future<HealthCheckResult> checkHealth() async {
    final stopwatch = Stopwatch()..start();

    try {
      final response = await _dio.get(
        AppEnvironment.healthEndpoint,
        options: Options(
          receiveTimeout: _timeout,
          sendTimeout: _timeout,
        ),
      );

      stopwatch.stop();
      final responseTime = stopwatch.elapsed;

      if (response.statusCode == 200) {
        _logger.i('Health check passed in ${responseTime.inMilliseconds}ms');

        return HealthCheckResult.healthy(
          message: _extractMessage(response.data),
          responseTime: responseTime,
          details: response.data is Map<String, dynamic>
              ? response.data as Map<String, dynamic>
              : null,
        );
      }

      _logger.w('Health check returned status ${response.statusCode}');
      return HealthCheckResult.unhealthy(
        message: 'Unexpected status code: ${response.statusCode}',
        responseTime: responseTime,
      );
    } on DioException catch (e) {
      stopwatch.stop();
      _logger.e('Health check failed', error: e.message);

      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        return HealthCheckResult.unhealthy(
          message: 'Connection timed out',
          responseTime: stopwatch.elapsed,
        );
      }

      if (e.type == DioExceptionType.connectionError) {
        return HealthCheckResult.unhealthy(
          message: 'Cannot connect to server',
        );
      }

      return HealthCheckResult.unhealthy(
        message: e.message ?? 'Unknown error',
        responseTime: stopwatch.elapsed,
      );
    } catch (e) {
      stopwatch.stop();
      _logger.e('Health check failed with unexpected error', error: e);

      return HealthCheckResult.unknown(
        message: e.toString(),
      );
    }
  }

  /// Check if backend is available (simple boolean check)
  Future<bool> isBackendAvailable() async {
    final result = await checkHealth();
    return result.isHealthy;
  }

  /// Wait for backend to become available
  Future<HealthCheckResult> waitForBackend({
    int maxAttempts = 5,
    Duration delay = const Duration(seconds: 2),
  }) async {
    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      _logger.d('Health check attempt $attempt/$maxAttempts');

      final result = await checkHealth();

      if (result.isHealthy) {
        return result;
      }

      if (attempt < maxAttempts) {
        await Future.delayed(delay);
      }
    }

    return HealthCheckResult.unhealthy(
      message: 'Backend not available after $maxAttempts attempts',
    );
  }

  /// Extract message from response
  String? _extractMessage(dynamic data) {
    if (data == null) return null;
    if (data is String) return data;

    if (data is Map<String, dynamic>) {
      return data['status'] as String? ??
          data['message'] as String? ??
          'OK';
    }

    return null;
  }
}

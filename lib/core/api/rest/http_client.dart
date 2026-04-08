import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../storage/secure_storage.dart';
import '../../errors/exceptions.dart';
import '../../../config/environment/environment.dart';

/// HTTP client factory using Dio
class HttpClientFactory {
  final SecureStorage _storage;
  final Logger _logger;

  Dio? _dio;

  HttpClientFactory({
    required SecureStorage storage,
    Logger? logger,
  })  : _storage = storage,
        _logger = logger ?? Logger();

  /// Get configured Dio instance
  Dio get client {
    _dio ??= _createClient();
    return _dio!;
  }

  /// Create a new Dio client with interceptors
  Dio _createClient() {
    final dio = Dio(
      BaseOptions(
        baseUrl: AppEnvironment.restBaseUrl,
        connectTimeout: AppEnvironment.connectionTimeout,
        receiveTimeout: AppEnvironment.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors
    dio.interceptors.addAll([
      _AuthInterceptor(_storage, _logger),
      _LoggingInterceptor(_logger),
      _RetryInterceptor(dio, maxRetries: AppEnvironment.maxRetries),
    ]);

    return dio;
  }

  /// Reset client (recreate with new config)
  void resetClient() {
    _dio = null;
  }
}

/// Auth interceptor for JWT token injection
class _AuthInterceptor extends Interceptor {
  final SecureStorage _storage;
  final Logger _logger;

  _AuthInterceptor(this._storage, this._logger);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for certain endpoints
    final skipAuthPaths = ['/health', '/login', '/register'];
    if (skipAuthPaths.any((path) => options.path.contains(path))) {
      return handler.next(options);
    }

    final token = await _storage.getToken();

    if (token != null) {
      final isExpired = await _storage.isTokenExpired();

      if (isExpired) {
        _logger.w('Token expired, skipping auth header');
        // Could trigger a refresh here if backend supports it
      } else {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    return handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Handle 401 errors globally
    if (err.response?.statusCode == 401) {
      _logger.w('Received 401, token may be expired');
      // Could trigger logout or token refresh here
    }

    return handler.next(err);
  }
}

/// Logging interceptor for debugging
class _LoggingInterceptor extends Interceptor {
  final Logger _logger;

  _LoggingInterceptor(this._logger);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (AppEnvironment.enableLogging) {
      _logger.d('→ ${options.method} ${options.uri}');
      if (options.data != null) {
        _logger.d('→ Body: ${options.data}');
      }
    }
    return handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (AppEnvironment.enableLogging) {
      _logger.d('← ${response.statusCode} ${response.requestOptions.uri}');
    }
    return handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _logger.e(
      '✗ ${err.response?.statusCode} ${err.requestOptions.uri}',
      error: err.message,
    );
    return handler.next(err);
  }
}

/// Retry interceptor with exponential backoff
class _RetryInterceptor extends Interceptor {
  final Dio _dio;
  final int maxRetries;
  final Duration initialDelay;

  _RetryInterceptor(
    this._dio, {
    this.maxRetries = 3,
    this.initialDelay = const Duration(seconds: 1),
  });

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Only retry on specific errors
    if (!_shouldRetry(err)) {
      return handler.next(err);
    }

    final retryCount = err.requestOptions.extra['retryCount'] ?? 0;

    if (retryCount >= maxRetries) {
      return handler.next(err);
    }

    // Calculate delay with exponential backoff
    final delay = initialDelay * (1 << retryCount);
    await Future.delayed(delay);

    // Retry the request
    try {
      final options = err.requestOptions;
      options.extra['retryCount'] = retryCount + 1;

      final response = await _dio.fetch(options);
      return handler.resolve(response);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }

  bool _shouldRetry(DioException err) {
    // Retry on connection errors and specific status codes
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError ||
        err.response?.statusCode == 502 ||
        err.response?.statusCode == 503 ||
        err.response?.statusCode == 504;
  }
}

/// HTTP service for REST API calls
class HttpService {
  final HttpClientFactory _clientFactory;

  HttpService({
    required HttpClientFactory clientFactory,
  })  : _clientFactory = clientFactory;

  Dio get _client => _clientFactory.client;

  /// Execute GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _client.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  /// Execute POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _client.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  /// Execute PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _client.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  /// Execute PATCH request
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _client.patch<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  /// Execute DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _client.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  /// Map Dio exceptions to app exceptions
  AppException _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return TimeoutException(
          message: 'Connection timed out',
          originalError: e,
        );

      case DioExceptionType.connectionError:
        return NetworkException(
          message: 'No internet connection',
          originalError: e,
        );

      case DioExceptionType.badResponse:
        return _mapStatusCode(
          e.response?.statusCode,
          e.response?.data,
          e,
        );

      case DioExceptionType.cancel:
        return ServerException(
          message: 'Request cancelled',
          originalError: e,
        );

      case DioExceptionType.badCertificate:
        return NetworkException(
          message: 'Invalid SSL certificate',
          originalError: e,
        );

      case DioExceptionType.unknown:
        return ServerException(
          message: e.message ?? 'Unknown error',
          originalError: e,
        );
    }
  }

  /// Map HTTP status codes to exceptions
  AppException _mapStatusCode(
    int? statusCode,
    dynamic responseData,
    DioException e,
  ) {
    final message = _extractErrorMessage(responseData) ?? 'Request failed';

    switch (statusCode) {
      case 400:
        return ValidationException(message: message, originalError: e);
      case 401:
        return AuthenticationException(message: message, originalError: e);
      case 403:
        return PermissionException(message: message, originalError: e);
      case 404:
        return NotFoundException(message: message, originalError: e);
      case 409:
        return ConflictException(message: message, originalError: e);
      case 422:
        return ValidationException(message: message, originalError: e);
      case 500:
        return ServerException(message: message, originalError: e);
      case 502:
      case 503:
      case 504:
        return ServiceUnavailableException(message: message, originalError: e);
      default:
        return ServerException(message: message, originalError: e);
    }
  }

  /// Extract error message from response data
  String? _extractErrorMessage(dynamic data) {
    if (data == null) return null;
    if (data is String) return data;

    if (data is Map<String, dynamic>) {
      return data['message'] as String? ??
          data['error'] as String? ??
          data['errors']?.toString();
    }

    return data.toString();
  }
}

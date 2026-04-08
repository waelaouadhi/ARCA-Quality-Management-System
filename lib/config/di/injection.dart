import 'package:get_it/get_it.dart';
import 'package:logger/logger.dart';

import '../../core/storage/secure_storage.dart';
import '../../core/api/graphql/graphql_client.dart';
import '../../core/api/rest/http_client.dart';
import '../../core/network/health_service.dart';

/// Global service locator instance
final GetIt sl = GetIt.instance;

/// Initialize all dependencies
Future<void> initDependencies() async {
  // Core services
  _initCoreServices();

  // API clients
  _initApiClients();

  // Network services
  _initNetworkServices();

  // Wait for async initialization
  await sl.allReady();
}

/// Initialize core services
void _initCoreServices() {
  // Logger
  sl.registerLazySingleton<Logger>(
    () => Logger(
      printer: PrettyPrinter(
        methodCount: 0,
        errorMethodCount: 5,
        lineLength: 80,
        colors: true,
        printEmojis: true,
        dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
      ),
    ),
  );

  // Secure Storage
  sl.registerLazySingleton<SecureStorage>(
    () => SecureStorage(),
  );
}

/// Initialize API clients
void _initApiClients() {
  // GraphQL Client Factory
  sl.registerLazySingleton<GraphQLClientFactory>(
    () => GraphQLClientFactory(
      storage: sl<SecureStorage>(),
      logger: sl<Logger>(),
    ),
  );

  // GraphQL Service
  sl.registerLazySingleton<GraphQLService>(
    () => GraphQLService(
      clientFactory: sl<GraphQLClientFactory>(),
      logger: sl<Logger>(),
    ),
  );

  // HTTP Client Factory
  sl.registerLazySingleton<HttpClientFactory>(
    () => HttpClientFactory(
      storage: sl<SecureStorage>(),
      logger: sl<Logger>(),
    ),
  );

  // HTTP Service
  sl.registerLazySingleton<HttpService>(
    () => HttpService(
      clientFactory: sl<HttpClientFactory>(),
    ),
  );
}

/// Initialize network services
void _initNetworkServices() {
  // Health Check Service
  sl.registerLazySingleton<HealthCheckService>(
    () => HealthCheckService(
      logger: sl<Logger>(),
    ),
  );
}

/// Reset all services (for testing or logout)
Future<void> resetDependencies() async {
  // Reset API clients
  sl<GraphQLClientFactory>().resetClient();
  sl<HttpClientFactory>().resetClient();

  // Clear secure storage
  await sl<SecureStorage>().clearAll();
}

/// Dispose all resources
Future<void> disposeDependencies() async {
  await sl.reset();
}

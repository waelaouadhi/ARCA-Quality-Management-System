/// Environment configuration for QMS application
/// Supports development, staging, and production environments
enum Environment {
  development,
  staging,
  production,
}

/// Environment configuration class
class EnvironmentConfig {
  final Environment environment;
  final String graphqlEndpoint;
  final String restBaseUrl;
  final String healthEndpoint;
  final String appName;
  final bool enableLogging;
  final bool enableAnalytics;
  final bool enableCrashReporting;
  final Duration connectionTimeout;
  final Duration receiveTimeout;
  final int maxRetries;

  const EnvironmentConfig._({
    required this.environment,
    required this.graphqlEndpoint,
    required this.restBaseUrl,
    required this.healthEndpoint,
    required this.appName,
    required this.enableLogging,
    required this.enableAnalytics,
    required this.enableCrashReporting,
    required this.connectionTimeout,
    required this.receiveTimeout,
    required this.maxRetries,
  });

  /// Development environment configuration
  factory EnvironmentConfig.development() {
    return const EnvironmentConfig._(
      environment: Environment.development,
      graphqlEndpoint: 'http://localhost:4000/graphql',
      restBaseUrl: 'http://localhost:4000/api',
      healthEndpoint: 'http://localhost:4000/health',
      appName: 'QMS Dev',
      enableLogging: true,
      enableAnalytics: false,
      enableCrashReporting: false,
      connectionTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      maxRetries: 3,
    );
  }

  /// Staging environment configuration
  factory EnvironmentConfig.staging() {
    return const EnvironmentConfig._(
      environment: Environment.staging,
      graphqlEndpoint: 'https://staging-api.qms-app.com/graphql',
      restBaseUrl: 'https://staging-api.qms-app.com/api',
      healthEndpoint: 'https://staging-api.qms-app.com/health',
      appName: 'QMS Staging',
      enableLogging: true,
      enableAnalytics: true,
      enableCrashReporting: true,
      connectionTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      maxRetries: 3,
    );
  }

  /// Production environment configuration
  factory EnvironmentConfig.production() {
    return const EnvironmentConfig._(
      environment: Environment.production,
      graphqlEndpoint: 'https://api.qms-app.com/graphql',
      restBaseUrl: 'https://api.qms-app.com/api',
      healthEndpoint: 'https://api.qms-app.com/health',
      appName: 'QMS',
      enableLogging: false,
      enableAnalytics: true,
      enableCrashReporting: true,
      connectionTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      maxRetries: 3,
    );
  }

  /// Check if this is development environment
  bool get isDevelopment => environment == Environment.development;

  /// Check if this is staging environment
  bool get isStaging => environment == Environment.staging;

  /// Check if this is production environment
  bool get isProduction => environment == Environment.production;

  /// Check if debug mode is enabled
  bool get isDebugMode => !isProduction;

  /// Deprecated - use graphqlEndpoint instead
  @Deprecated('Use graphqlEndpoint instead')
  String get apiBaseUrl => graphqlEndpoint;
}

/// Singleton to hold current environment config
class AppEnvironment {
  static EnvironmentConfig _config = EnvironmentConfig.development();

  static EnvironmentConfig get config => _config;

  static void initialize(Environment environment) {
    switch (environment) {
      case Environment.development:
        _config = EnvironmentConfig.development();
        break;
      case Environment.staging:
        _config = EnvironmentConfig.staging();
        break;
      case Environment.production:
        _config = EnvironmentConfig.production();
        break;
    }
  }

  // Convenience getters
  static String get graphqlEndpoint => _config.graphqlEndpoint;
  static String get restBaseUrl => _config.restBaseUrl;
  static String get healthEndpoint => _config.healthEndpoint;
  static String get appName => _config.appName;
  static bool get isDevelopment => _config.isDevelopment;
  static bool get isStaging => _config.isStaging;
  static bool get isProduction => _config.isProduction;
  static bool get isDebugMode => _config.isDebugMode;
  static bool get enableLogging => _config.enableLogging;
  static bool get enableAnalytics => _config.enableAnalytics;
  static bool get enableCrashReporting => _config.enableCrashReporting;
  static Duration get connectionTimeout => _config.connectionTimeout;
  static Duration get receiveTimeout => _config.receiveTimeout;
  static int get maxRetries => _config.maxRetries;
}

import 'package:graphql_flutter/graphql_flutter.dart' as gql_flutter;
import 'package:logger/logger.dart';

import '../../storage/secure_storage.dart';
import '../../errors/exceptions.dart';
import '../../../config/environment/environment.dart';

// Re-export some graphql_flutter types for convenience
export 'package:graphql_flutter/graphql_flutter.dart' show QueryResult, FetchPolicy, gql;

/// GraphQL client factory and configuration
class GraphQLClientFactory {
  final SecureStorage _storage;
  final Logger _logger;

  gql_flutter.GraphQLClient? _client;
  String? _currentToken;

  GraphQLClientFactory({
    required SecureStorage storage,
    Logger? logger,
  })  : _storage = storage,
        _logger = logger ?? Logger();

  /// Initialize the GraphQL client
  Future<gql_flutter.GraphQLClient> get client async {
    final token = await _storage.getToken();

    // Return existing client if token hasn't changed
    if (_client != null && _currentToken == token) {
      return _client!;
    }

    _currentToken = token;
    _client = _createClient(token);
    return _client!;
  }

  /// Create a new GraphQL client instance
  gql_flutter.GraphQLClient _createClient(String? token) {
    final httpLink = gql_flutter.HttpLink(
      AppEnvironment.graphqlEndpoint,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    );

    // Auth link for JWT injection
    final authLink = gql_flutter.AuthLink(
      getToken: () async {
        final currentToken = await _storage.getToken();
        if (currentToken == null) return null;

        // Check if token is expired
        final isExpired = await _storage.isTokenExpired();
        if (isExpired) {
          _logger.w('Token expired, clearing auth');
          return null;
        }

        return 'Bearer $currentToken';
      },
    );

    // Combine links
    final link = authLink.concat(httpLink);

    // Create cache
    final cache = gql_flutter.GraphQLCache(
      store: gql_flutter.InMemoryStore(),
    );

    return gql_flutter.GraphQLClient(
      link: link,
      cache: cache,
      defaultPolicies: gql_flutter.DefaultPolicies(
        query: gql_flutter.Policies(
          fetch: gql_flutter.FetchPolicy.cacheAndNetwork,
          error: gql_flutter.ErrorPolicy.all,
        ),
        mutate: gql_flutter.Policies(
          fetch: gql_flutter.FetchPolicy.networkOnly,
          error: gql_flutter.ErrorPolicy.all,
        ),
      ),
    );
  }

  /// Reset client (call after login/logout)
  void resetClient() {
    _client = null;
    _currentToken = null;
  }

  /// Clear cache
  Future<void> clearCache() async {
    final currentClient = await client;
    currentClient.cache.store.reset();
  }
}

/// GraphQL service for executing queries and mutations
class GraphQLService {
  final GraphQLClientFactory _clientFactory;
  final Logger _logger;

  GraphQLService({
    required GraphQLClientFactory clientFactory,
    Logger? logger,
  })  : _clientFactory = clientFactory,
        _logger = logger ?? Logger();

  /// Execute a GraphQL query
  Future<gql_flutter.QueryResult> query(
    String query, {
    Map<String, dynamic>? variables,
    gql_flutter.FetchPolicy? fetchPolicy,
    String? operationName,
  }) async {
    final client = await _clientFactory.client;

    if (AppEnvironment.enableLogging) {
      _logger.d('GraphQL Query: $operationName');
      _logger.d('Variables: $variables');
    }

    final options = gql_flutter.QueryOptions(
      document: gql_flutter.gql(query),
      variables: variables ?? {},
      fetchPolicy: fetchPolicy ?? gql_flutter.FetchPolicy.cacheAndNetwork,
      operationName: operationName,
    );

    final result = await client.query(options);

    if (result.hasException) {
      _handleException(result.exception!);
    }

    return result;
  }

  /// Execute a GraphQL mutation
  Future<gql_flutter.QueryResult> mutate(
    String mutation, {
    Map<String, dynamic>? variables,
    gql_flutter.FetchPolicy? fetchPolicy,
    String? operationName,
  }) async {
    final client = await _clientFactory.client;

    if (AppEnvironment.enableLogging) {
      _logger.d('GraphQL Mutation: $operationName');
      _logger.d('Variables: $variables');
    }

    final options = gql_flutter.MutationOptions(
      document: gql_flutter.gql(mutation),
      variables: variables ?? {},
      fetchPolicy: fetchPolicy ?? gql_flutter.FetchPolicy.networkOnly,
      operationName: operationName,
    );

    final result = await client.mutate(options);

    if (result.hasException) {
      _handleException(result.exception!);
    }

    return result;
  }

  /// Handle GraphQL exceptions
  void _handleException(gql_flutter.OperationException exception) {
    // Check for network errors
    if (exception.linkException != null) {
      throw NetworkException(
        message: 'Connection error: ${exception.linkException.toString()}',
        originalError: exception.linkException,
      );
    }

    // Handle GraphQL errors
    if (exception.graphqlErrors.isNotEmpty) {
      final error = exception.graphqlErrors.first;
      final code = error.extensions?['code'] as String?;
      final message = error.message;

      switch (code) {
        case 'UNAUTHENTICATED':
          throw AuthenticationException(message: message);
        case 'FORBIDDEN':
          throw PermissionException(message: message);
        case 'BAD_USER_INPUT':
          throw ValidationException(
            message: message,
            fieldErrors: _extractFieldErrors(error.extensions),
          );
        case 'NOT_FOUND':
          throw NotFoundException(message: message);
        case 'INTERNAL_SERVER_ERROR':
        default:
          throw ServerException(message: message);
      }
    }

    throw ServerException(
      message: 'Unknown GraphQL error',
      originalError: exception,
    );
  }

  /// Extract field validation errors from GraphQL extensions
  Map<String, List<String>>? _extractFieldErrors(
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

  /// Clear GraphQL cache
  Future<void> clearCache() async {
    await _clientFactory.clearCache();
  }

  /// Reset client (call after login/logout)
  void resetClient() {
    _clientFactory.resetClient();
  }
}

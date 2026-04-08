import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:logger/logger.dart';

import '../models/auth_request_models.dart';
import '../models/auth_response_model.dart';
import '../models/user_model.dart';
import 'auth_graphql_queries.dart';

/// Remote data source for authentication using GraphQL
abstract class AuthRemoteDataSource {
  /// Register a new user
  Future<AuthResponseModel> register(RegisterRequestModel request);

  /// Login with email and password
  Future<AuthResponseModel> login(LoginRequestModel request);

  /// Get current user information
  Future<UserModel> getCurrentUser();
}

/// Implementation of AuthRemoteDataSource using GraphQL
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final GraphQLClient _client;
  final Logger _logger;

  AuthRemoteDataSourceImpl({
    required GraphQLClient client,
    Logger? logger,
  })  : _client = client,
        _logger = logger ?? Logger();

  @override
  Future<AuthResponseModel> register(RegisterRequestModel request) async {
    _logger.d('Registering user with email: ${request.email}');

    try {
      final result = await _client.mutate(
        MutationOptions(
          document: AuthGraphQLQueries.registerDocument,
          variables: request.toGraphQLInput(),
          fetchPolicy: FetchPolicy.networkOnly,
          errorPolicy: ErrorPolicy.all,
        ),
      );

      _handleGraphQLErrors(result);

      final data = result.data?['register'] as Map<String, dynamic>?;
      if (data == null) {
        throw Exception('No data received from register mutation');
      }

      _logger.i('User registration successful');
      return AuthResponseModel.fromJson(data);
    } catch (e) {
      _logger.e('Registration failed', error: e);
      rethrow;
    }
  }

  @override
  Future<AuthResponseModel> login(LoginRequestModel request) async {
    _logger.d('Logging in user with email: ${request.email}');

    try {
      final result = await _client.mutate(
        MutationOptions(
          document: AuthGraphQLQueries.loginDocument,
          variables: request.toGraphQLInput(),
          fetchPolicy: FetchPolicy.networkOnly,
          errorPolicy: ErrorPolicy.all,
        ),
      );

      _handleGraphQLErrors(result);

      final data = result.data?['login'] as Map<String, dynamic>?;
      if (data == null) {
        throw Exception('No data received from login mutation');
      }

      _logger.i('User login successful');
      return AuthResponseModel.fromJson(data);
    } catch (e) {
      _logger.e('Login failed', error: e);
      rethrow;
    }
  }

  @override
  Future<UserModel> getCurrentUser() async {
    _logger.d('Fetching current user');

    try {
      final result = await _client.query(
        QueryOptions(
          document: AuthGraphQLQueries.getCurrentUserDocument,
          fetchPolicy: FetchPolicy.networkOnly,
          errorPolicy: ErrorPolicy.all,
        ),
      );

      _handleGraphQLErrors(result);

      final data = result.data?['me'] as Map<String, dynamic>?;
      if (data == null) {
        throw Exception('No user data received from me query');
      }

      _logger.i('Current user fetched successfully');
      return UserModel.fromJson(data);
    } catch (e) {
      _logger.e('Failed to fetch current user', error: e);
      rethrow;
    }
  }

  /// Handle GraphQL errors and throw appropriate exceptions
  void _handleGraphQLErrors(QueryResult result) {
    if (result.hasException) {
      final exception = result.exception!;

      // Handle GraphQL errors
      if (exception.graphqlErrors.isNotEmpty) {
        final error = exception.graphqlErrors.first;
        final message = error.message;
        
        _logger.w('GraphQL error: $message');
        
        // Map specific error types to custom exceptions
        if (message.toLowerCase().contains('invalid credentials') ||
            message.toLowerCase().contains('authentication failed')) {
          throw AuthenticationException(message);
        }
        
        if (message.toLowerCase().contains('user already exists') ||
            message.toLowerCase().contains('email already taken')) {
          throw UserAlreadyExistsException(message);
        }
        
        if (message.toLowerCase().contains('validation failed') ||
            message.toLowerCase().contains('invalid input')) {
          throw ValidationException(message);
        }
        
        throw GraphQLException(message);
      }

      // Handle network errors
      if (exception.linkException != null) {
        _logger.w('Network error: ${exception.linkException}');
        throw NetworkException('Network error occurred');
      }

      // Generic exception
      throw Exception('Unknown GraphQL error occurred');
    }
  }
}

/// Authentication-specific exceptions
class AuthenticationException implements Exception {
  final String message;
  AuthenticationException(this.message);
  
  @override
  String toString() => 'AuthenticationException: $message';
}

class UserAlreadyExistsException implements Exception {
  final String message;
  UserAlreadyExistsException(this.message);
  
  @override
  String toString() => 'UserAlreadyExistsException: $message';
}

class ValidationException implements Exception {
  final String message;
  ValidationException(this.message);
  
  @override
  String toString() => 'ValidationException: $message';
}

class GraphQLException implements Exception {
  final String message;
  GraphQLException(this.message);
  
  @override
  String toString() => 'GraphQLException: $message';
}

class NetworkException implements Exception {
  final String message;
  NetworkException(this.message);
  
  @override
  String toString() => 'NetworkException: $message';
}
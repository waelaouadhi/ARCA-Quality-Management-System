import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:logger/logger.dart';

import '../../../auth/data/models/user_model.dart';
import '../../../../shared/models/pagination.dart';
import '../models/users_list_model.dart';
import '../models/update_user_request_model.dart';
import 'users_graphql_queries.dart';

/// Remote data source for user management using GraphQL
abstract class UsersRemoteDataSource {
  /// Get paginated list of users
  Future<UsersListModel> getUsers({
    required PaginationInput pagination,
    String? search,
    String? roleFilter,
  });

  /// Get single user by ID
  Future<UserModel> getUserById(String id);

  /// Update user information
  Future<UserModel> updateUser(String id, UpdateUserRequestModel request);

  /// Delete user
  Future<void> deleteUser(String id);
}

/// Implementation of UsersRemoteDataSource using GraphQL
class UsersRemoteDataSourceImpl implements UsersRemoteDataSource {
  final GraphQLClient _client;
  final Logger _logger;

  UsersRemoteDataSourceImpl({
    required GraphQLClient client,
    Logger? logger,
  })  : _client = client,
        _logger = logger ?? Logger();

  @override
  Future<UsersListModel> getUsers({
    required PaginationInput pagination,
    String? search,
    String? roleFilter,
  }) async {
    _logger.d('Fetching users: page=${pagination.page}, limit=${pagination.limit}');
    final variables = {
      'pagination': pagination.toJson(),
    };

    try {
      // Add search filter if provided
      if (search != null && search.isNotEmpty) {
        // Note: Backend doesn't seem to support search in the users query yet
        // This will be implemented when backend adds search support
      }

      final result = await _client.query(
        QueryOptions(
          document: UsersGraphQLQueries.getUsersDocument,
          variables: variables,
          fetchPolicy: FetchPolicy.cacheAndNetwork,
          errorPolicy: ErrorPolicy.all,
        ),
      );

      _handleGraphQLErrors(result);

      final data = result.data?['users'] as Map<String, dynamic>?;
      if (data == null) {
        throw Exception('No data received from users query');
      }

      _logger.i('Users fetched successfully: ${data['pagination']['total']} total');
      return UsersListModel.fromJson(data);
    } on NetworkException {
      // Fallback to cache for read-only offline access.
      final cachedResult = await _client.query(
        QueryOptions(
          document: UsersGraphQLQueries.getUsersDocument,
          variables: variables,
          fetchPolicy: FetchPolicy.cacheFirst,
          errorPolicy: ErrorPolicy.all,
        ),
      );
      final cachedData = cachedResult.data?['users'] as Map<String, dynamic>?;
      if (cachedData != null) {
        _logger.i('Returning cached users data (offline mode)');
        return UsersListModel.fromJson(cachedData);
      }
      rethrow;
    } catch (e) {
      _logger.e('Failed to fetch users', error: e);
      rethrow;
    }
  }

  @override
  Future<UserModel> getUserById(String id) async {
    _logger.d('Fetching user by ID: $id');

    try {
      final result = await _client.query(
        QueryOptions(
          document: UsersGraphQLQueries.getUserByIdDocument,
          variables: {'id': id},
          fetchPolicy: FetchPolicy.cacheAndNetwork,
          errorPolicy: ErrorPolicy.all,
        ),
      );

      _handleGraphQLErrors(result);

      final data = result.data?['user'] as Map<String, dynamic>?;
      if (data == null) {
        throw Exception('User not found');
      }

      _logger.i('User fetched successfully');
      return UserModel.fromJson(data);
    } on NetworkException {
      final cachedResult = await _client.query(
        QueryOptions(
          document: UsersGraphQLQueries.getUserByIdDocument,
          variables: {'id': id},
          fetchPolicy: FetchPolicy.cacheFirst,
          errorPolicy: ErrorPolicy.all,
        ),
      );
      final cachedData = cachedResult.data?['user'] as Map<String, dynamic>?;
      if (cachedData != null) {
        _logger.i('Returning cached user data (offline mode)');
        return UserModel.fromJson(cachedData);
      }
      rethrow;
    } catch (e) {
      _logger.e('Failed to fetch user by ID', error: e);
      rethrow;
    }
  }

  @override
  Future<UserModel> updateUser(String id, UpdateUserRequestModel request) async {
    _logger.d('Updating user: $id');

    try {
      final result = await _client.mutate(
        MutationOptions(
          document: UsersGraphQLQueries.updateUserDocument,
          variables: request.toGraphQLInput(id),
          fetchPolicy: FetchPolicy.networkOnly,
          errorPolicy: ErrorPolicy.all,
        ),
      );

      _handleGraphQLErrors(result);

      final data = result.data?['updateUser'] as Map<String, dynamic>?;
      if (data == null) {
        throw Exception('No data received from updateUser mutation');
      }

      _logger.i('User updated successfully');
      return UserModel.fromJson(data);
    } catch (e) {
      _logger.e('Failed to update user', error: e);
      rethrow;
    }
  }

  @override
  Future<void> deleteUser(String id) async {
    _logger.d('Deleting user: $id');

    try {
      final result = await _client.mutate(
        MutationOptions(
          document: UsersGraphQLQueries.deleteUserDocument,
          variables: {'id': id},
          fetchPolicy: FetchPolicy.networkOnly,
          errorPolicy: ErrorPolicy.all,
        ),
      );

      _handleGraphQLErrors(result);

      _logger.i('User deleted successfully');
    } catch (e) {
      _logger.e('Failed to delete user', error: e);
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
        if (message.toLowerCase().contains('access denied') ||
            message.toLowerCase().contains('unauthorized')) {
          throw UnauthorizedException(message);
        }
        
        if (message.toLowerCase().contains('not found')) {
          throw NotFoundException(message);
        }
        
        if (message.toLowerCase().contains('validation') ||
            message.toLowerCase().contains('invalid')) {
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

/// User management specific exceptions
class UnauthorizedException implements Exception {
  final String message;
  UnauthorizedException(this.message);
  
  @override
  String toString() => 'UnauthorizedException: $message';
}

class NotFoundException implements Exception {
  final String message;
  NotFoundException(this.message);
  
  @override
  String toString() => 'NotFoundException: $message';
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

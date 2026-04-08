import '../../../../core/api/graphql/graphql_client.dart';

/// GraphQL queries and mutations for user management
class UsersGraphQLQueries {
  UsersGraphQLQueries._();

  /// User fragment for reuse
  static const userFragment = '''
    fragment UserFragment on User {
      id
      email
      firstName
      lastName
      role
      createdAt
      updatedAt
    }
  ''';

  /// Get paginated users query
  static const getUsersQuery = '''
    $userFragment
    
    query GetUsers(\$pagination: PaginationInput!) {
      users(pagination: \$pagination) {
        data {
          ...UserFragment
        }
        pagination {
          page
          limit
          total
          totalPages
          hasNext
          hasPrev
        }
      }
    }
  ''';

  /// Get single user by ID query
  static const getUserByIdQuery = '''
    $userFragment
    
    query GetUserById(\$id: ID!) {
      user(id: \$id) {
        ...UserFragment
      }
    }
  ''';

  /// Update user mutation
  static const updateUserMutation = '''
    $userFragment
    
    mutation UpdateUser(\$id: ID!, \$input: UpdateUserInput!) {
      updateUser(id: \$id, input: \$input) {
        ...UserFragment
      }
    }
  ''';

  /// Delete user mutation
  static const deleteUserMutation = '''
    mutation DeleteUser(\$id: ID!) {
      deleteUser(id: \$id)
    }
  ''';

  /// Search users query
  static const searchUsersQuery = '''
    $userFragment
    
    query SearchUsers(\$query: String!, \$pagination: PaginationInput!) {
      users(pagination: \$pagination, search: \$query) {
        data {
          ...UserFragment
        }
        pagination {
          page
          limit
          total
          totalPages
          hasNext
          hasPrev
        }
      }
    }
  ''';

  /// Parsed GraphQL documents for use with graphql_flutter
  static final getUsersDocument = gql(getUsersQuery);
  static final getUserByIdDocument = gql(getUserByIdQuery);
  static final updateUserDocument = gql(updateUserMutation);
  static final deleteUserDocument = gql(deleteUserMutation);
  static final searchUsersDocument = gql(searchUsersQuery);
}

import '../../../../core/api/graphql/graphql_client.dart';

/// GraphQL queries and mutations for authentication
class AuthGraphQLQueries {
  AuthGraphQLQueries._();

  /// User fragment for reuse across queries
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

  /// Register mutation
  static const registerMutation = '''
    $userFragment
    
    mutation Register(\$input: RegisterInput!) {
      register(input: \$input) {
        accessToken: token
        user {
          ...UserFragment
        }
      }
    }
  ''';

  /// Login mutation
  static const loginMutation = '''
    $userFragment
    
    mutation Login(\$input: LoginInput!) {
      login(input: \$input) {
        accessToken: token
        user {
          ...UserFragment
        }
      }
    }
  ''';

  /// Get current user query
  static const getCurrentUserQuery = '''
    $userFragment
    
    query GetCurrentUser {
      me {
        ...UserFragment
      }
    }
  ''';

  /// Parsed GraphQL documents for use with graphql_flutter
  static final registerDocument = gql(registerMutation);
  static final loginDocument = gql(loginMutation);
  static final getCurrentUserDocument = gql(getCurrentUserQuery);
}

import 'package:dartz/dartz.dart';

import '../../../auth/domain/entities/user.dart';
import '../../../../core/errors/failures.dart';
import '../../../../shared/models/pagination.dart';
import '../entities/users_list.dart';

/// Repository interface for user management operations
abstract class UsersRepository {
  /// Get paginated list of users
  Future<Either<Failure, UsersList>> getUsers({
    required PaginationInput pagination,
    String? search,
    String? roleFilter,
  });

  /// Get single user by ID
  Future<Either<Failure, User>> getUserById(String id);

  /// Update user information
  Future<Either<Failure, User>> updateUser({
    required String id,
    String? firstName,
    String? lastName,
    String? email,
  });

  /// Delete user
  Future<Either<Failure, void>> deleteUser(String id);

  /// Search users by name or email
  Future<Either<Failure, List<User>>> searchUsers(String query);
}
import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../../shared/models/pagination.dart';
import '../entities/users_list.dart';
import '../repositories/users_repository.dart';

/// Use case for getting paginated users list
class GetUsersUseCase {
  final UsersRepository repository;

  const GetUsersUseCase(this.repository);

  /// Execute get users operation
  Future<Either<Failure, UsersList>> call({
    required PaginationInput pagination,
    String? search,
    String? roleFilter,
  }) async {
    return await repository.getUsers(
      pagination: pagination,
      search: search,
      roleFilter: roleFilter,
    );
  }
}
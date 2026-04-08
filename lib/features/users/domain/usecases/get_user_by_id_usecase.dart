import 'package:dartz/dartz.dart';

import '../../../auth/domain/entities/user.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/users_repository.dart';

/// Use case for getting a single user by ID
class GetUserByIdUseCase {
  final UsersRepository repository;

  const GetUserByIdUseCase(this.repository);

  /// Execute get user by ID operation
  Future<Either<Failure, User>> call(String id) async {
    if (id.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'User ID is required'));
    }

    return await repository.getUserById(id);
  }
}
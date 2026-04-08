import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../repositories/users_repository.dart';

/// Use case for deleting a user
class DeleteUserUseCase {
  final UsersRepository repository;

  const DeleteUserUseCase(this.repository);

  /// Execute delete user operation
  Future<Either<Failure, void>> call(String id) async {
    if (id.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'User ID is required'));
    }

    return await repository.deleteUser(id);
  }
}
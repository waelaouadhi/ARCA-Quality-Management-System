import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Use case for getting current user information
class GetCurrentUserUseCase {
  final AuthRepository repository;

  const GetCurrentUserUseCase(this.repository);

  /// Execute get current user
  Future<Either<Failure, User>> call() async {
    // Check if user is authenticated first
    final isAuthenticated = await repository.isAuthenticated();
    if (!isAuthenticated) {
      return const Left(AuthenticationFailure(
        message: 'User is not authenticated'
      ));
    }

    // Get current user information
    return await repository.getCurrentUser();
  }
}

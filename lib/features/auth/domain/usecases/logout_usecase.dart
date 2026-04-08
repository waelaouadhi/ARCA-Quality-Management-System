import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../repositories/auth_repository.dart';

/// Use case for user logout
class LogoutUseCase {
  final AuthRepository repository;

  const LogoutUseCase(this.repository);

  /// Execute user logout
  Future<Either<Failure, void>> call() async {
    // Clear authentication data and logout
    return await repository.logout();
  }
}

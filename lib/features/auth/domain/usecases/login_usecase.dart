import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/auth_response.dart';
import '../repositories/auth_repository.dart';

/// Use case for user login
class LoginUseCase {
  final AuthRepository repository;

  const LoginUseCase(this.repository);

  /// Execute user login
  Future<Either<Failure, AuthResponse>> call({
    required String email,
    required String password,
  }) async {
    // Validate input parameters
    if (email.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'Email is required'));
    }

    if (!_isValidEmail(email)) {
      return const Left(ValidationFailure(message: 'Please enter a valid email address'));
    }

    if (password.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'Password is required'));
    }

    // Call repository to authenticate user
    return await repository.login(
      email: email.trim(),
      password: password,
    );
  }

  /// Validate email format
  bool _isValidEmail(String email) {
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(email);
  }
}

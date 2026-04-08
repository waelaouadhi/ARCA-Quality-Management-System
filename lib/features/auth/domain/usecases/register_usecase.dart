import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/auth_response.dart';
import '../repositories/auth_repository.dart';

/// Use case for user registration
class RegisterUseCase {
  final AuthRepository repository;

  const RegisterUseCase(this.repository);

  /// Execute user registration
  Future<Either<Failure, AuthResponse>> call({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
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

    if (password.length < 8) {
      return const Left(ValidationFailure(message: 'Password must be at least 8 characters long'));
    }

    if (firstName.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'First name is required'));
    }

    if (lastName.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'Last name is required'));
    }

    // Call repository to register user
    return await repository.register(
      email: email.trim(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    );
  }

  /// Validate email format
  bool _isValidEmail(String email) {
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(email);
  }
}

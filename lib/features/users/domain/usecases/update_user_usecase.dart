import 'package:dartz/dartz.dart';

import '../../../auth/domain/entities/user.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/users_repository.dart';

/// Use case for updating user information
class UpdateUserUseCase {
  final UsersRepository repository;

  const UpdateUserUseCase(this.repository);

  /// Execute update user operation
  Future<Either<Failure, User>> call({
    required String id,
    String? firstName,
    String? lastName,
    String? email,
  }) async {
    // Validate ID
    if (id.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'User ID is required'));
    }

    // Validate email format if provided
    if (email != null && email.isNotEmpty) {
      if (!_isValidEmail(email)) {
        return const Left(ValidationFailure(message: 'Please enter a valid email address'));
      }
    }

    // Validate names if provided
    if (firstName != null && firstName.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'First name cannot be empty'));
    }

    if (lastName != null && lastName.trim().isEmpty) {
      return const Left(ValidationFailure(message: 'Last name cannot be empty'));
    }

    return await repository.updateUser(
      id: id,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: email?.trim(),
    );
  }

  /// Validate email format
  bool _isValidEmail(String email) {
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(email);
  }
}
import '../repositories/auth_repository.dart';

/// Use case for checking authentication status
class CheckAuthStatusUseCase {
  final AuthRepository repository;

  const CheckAuthStatusUseCase(this.repository);

  /// Check if user is currently authenticated
  Future<bool> call() async {
    return await repository.isAuthenticated();
  }
}
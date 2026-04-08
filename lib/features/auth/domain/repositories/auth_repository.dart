import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/auth_response.dart';
import '../entities/user.dart';

/// Repository interface for authentication operations
abstract class AuthRepository {
  /// Register a new user
  /// Returns [AuthResponse] on success, [Failure] on error
  Future<Either<Failure, AuthResponse>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  });

  /// Login with email and password
  /// Returns [AuthResponse] on success, [Failure] on error
  Future<Either<Failure, AuthResponse>> login({
    required String email,
    required String password,
  });

  /// Get current user information
  /// Returns [User] on success, [Failure] on error
  Future<Either<Failure, User>> getCurrentUser();

  /// Logout current user
  /// Returns success on completion, [Failure] on error
  Future<Either<Failure, void>> logout();

  /// Check if user is currently authenticated
  /// Returns true if authenticated, false otherwise
  Future<bool> isAuthenticated();

  /// Get stored authentication token
  /// Returns token if available, null otherwise
  Future<String?> getToken();

  /// Save authentication data securely
  /// Returns success on completion, [Failure] on error
  Future<Either<Failure, void>> saveAuthData(AuthResponse authResponse);

  /// Clear all stored authentication data
  /// Returns success on completion, [Failure] on error
  Future<Either<Failure, void>> clearAuthData();

  /// Check if stored token is expired
  /// Returns true if expired or no token, false if valid
  Future<bool> isTokenExpired();

  /// Refresh authentication token (if supported by backend)
  /// Returns new [AuthResponse] on success, [Failure] on error
  Future<Either<Failure, AuthResponse>> refreshToken();
}

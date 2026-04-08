import 'package:dartz/dartz.dart';
import 'package:logger/logger.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/auth_response.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/auth_request_models.dart';
import '../services/auth_storage_service.dart';

/// Implementation of AuthRepository
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final AuthStorageService _storageService;
  final Logger _logger;

  AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required AuthStorageService storageService,
    Logger? logger,
  })  : _remoteDataSource = remoteDataSource,
        _storageService = storageService,
        _logger = logger ?? Logger();

  @override
  Future<Either<Failure, AuthResponse>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      _logger.d('Registering user: $email');

      final request = RegisterRequestModel(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );

      final authResponse = await _remoteDataSource.register(request);

      // Save authentication data locally
      await _storageService.saveAuthResponse(authResponse.toEntity());

      _logger.i('User registration and data storage successful');
      return Right(authResponse.toEntity());
    } on UserAlreadyExistsException catch (e) {
      _logger.w('User already exists: ${e.message}');
      return Left(ValidationFailure(message: e.message));
    } on ValidationException catch (e) {
      _logger.w('Validation error: ${e.message}');
      return Left(ValidationFailure(message: e.message));
    } on NetworkException catch (e) {
      _logger.e('Network error during registration: ${e.message}');
      return Left(NetworkFailure(message: e.message));
    } catch (e) {
      _logger.e('Unexpected error during registration', error: e);
      return Left(ServerFailure(
        message: 'Registration failed. Please try again.',
      ));
    }
  }

  @override
  Future<Either<Failure, AuthResponse>> login({
    required String email,
    required String password,
  }) async {
    try {
      _logger.d('Logging in user: $email');

      final request = LoginRequestModel(
        email: email,
        password: password,
      );

      final authResponse = await _remoteDataSource.login(request);

      // Save authentication data locally
      await _storageService.saveAuthResponse(authResponse.toEntity());

      _logger.i('User login and data storage successful');
      return Right(authResponse.toEntity());
    } on AuthenticationException catch (e) {
      _logger.w('Authentication failed: ${e.message}');
      return Left(AuthenticationFailure(message: e.message));
    } on ValidationException catch (e) {
      _logger.w('Validation error: ${e.message}');
      return Left(ValidationFailure(message: e.message));
    } on NetworkException catch (e) {
      _logger.e('Network error during login: ${e.message}');
      return Left(NetworkFailure(message: e.message));
    } catch (e) {
      _logger.e('Unexpected error during login', error: e);
      return Left(ServerFailure(
        message: 'Login failed. Please try again.',
      ));
    }
  }

  @override
  Future<Either<Failure, User>> getCurrentUser() async {
    try {
      _logger.d('Fetching current user');

      // First check if we have valid session
      final isAuthenticated = await _storageService.isAuthenticated();
      if (!isAuthenticated) {
        return const Left(AuthenticationFailure(
          message: 'User is not authenticated',
        ));
      }

      // Try to get user from remote source
      final user = await _remoteDataSource.getCurrentUser();

      // Update local user data
      await _storageService.saveUser(user.toEntity());

      _logger.i('Current user fetched and updated successfully');
      return Right(user.toEntity());
    } on NetworkException catch (e) {
      _logger.e('Network error fetching current user: ${e.message}');
      
      // Try to return cached user data
      final cachedUser = await _storageService.getUser();
      if (cachedUser != null) {
        _logger.i('Returning cached user data');
        return Right(cachedUser);
      }
      
      return Left(NetworkFailure(message: e.message));
    } catch (e) {
      _logger.e('Error fetching current user', error: e);
      
      // Try to return cached user data
      final cachedUser = await _storageService.getUser();
      if (cachedUser != null) {
        _logger.i('Returning cached user data after error');
        return Right(cachedUser);
      }
      
      return Left(ServerFailure(
        message: 'Failed to get user information',
      ));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      _logger.d('Logging out user');

      // Clear all stored authentication data
      await _storageService.clearAuthData();

      _logger.i('User logout successful');
      return const Right(null);
    } catch (e) {
      _logger.e('Error during logout', error: e);
      return Left(ServerFailure(
        message: 'Logout failed. Please try again.',
      ));
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    try {
      return await _storageService.isSessionValid();
    } catch (e) {
      _logger.e('Error checking authentication status', error: e);
      return false;
    }
  }

  @override
  Future<String?> getToken() async {
    try {
      return await _storageService.getToken();
    } catch (e) {
      _logger.e('Error getting token', error: e);
      return null;
    }
  }

  @override
  Future<Either<Failure, void>> saveAuthData(AuthResponse authResponse) async {
    try {
      _logger.d('Saving authentication data');

      await _storageService.saveAuthResponse(authResponse);

      _logger.i('Authentication data saved successfully');
      return const Right(null);
    } catch (e) {
      _logger.e('Error saving authentication data', error: e);
      return Left(CacheFailure(
        message: 'Failed to save authentication data',
      ));
    }
  }

  @override
  Future<Either<Failure, void>> clearAuthData() async {
    try {
      _logger.d('Clearing authentication data');

      await _storageService.clearAuthData();

      _logger.i('Authentication data cleared successfully');
      return const Right(null);
    } catch (e) {
      _logger.e('Error clearing authentication data', error: e);
      return Left(CacheFailure(
        message: 'Failed to clear authentication data',
      ));
    }
  }

  @override
  Future<bool> isTokenExpired() async {
    try {
      return await _storageService.isTokenExpired();
    } catch (e) {
      _logger.e('Error checking token expiry', error: e);
      return true; // Assume expired on error for safety
    }
  }

  @override
  Future<Either<Failure, AuthResponse>> refreshToken() async {
    // Note: This would be implemented if the backend supports token refresh
    // For now, return not implemented
      return const Left(UnknownFailure(
        message: 'Token refresh is not yet implemented',
      ));
  }
}

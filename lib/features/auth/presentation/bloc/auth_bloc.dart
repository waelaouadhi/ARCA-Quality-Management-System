import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';

import '../../domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

/// BLoC for managing authentication state
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;
  final Logger? _logger;

  AuthBloc({
    required AuthRepository authRepository,
    Logger? logger,
  })  : _authRepository = authRepository,
        _logger = logger,
        super(const AuthInitial()) {
    // Register event handlers
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthLoginRequested>(_onAuthLoginRequested);
    on<AuthRegisterRequested>(_onAuthRegisterRequested);
    on<AuthLogoutRequested>(_onAuthLogoutRequested);
    on<AuthUserRefreshRequested>(_onAuthUserRefreshRequested);
    on<AuthSessionRestoreRequested>(_onAuthSessionRestoreRequested);
  }

  /// Check if user is authenticated
  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      _logger?.d('Checking authentication status...');
      final isAuthenticated = await _authRepository.isAuthenticated();

      if (isAuthenticated) {
        final result = await _authRepository.getCurrentUser();
        result.fold(
          (failure) {
            _logger?.w('Token exists but user data failed: ${failure.message}');
            emit(const AuthUnauthenticated(message: 'Session expired'));
          },
          (user) {
            _logger?.i('User is authenticated: ${user.email}');
            emit(AuthAuthenticated(user));
          },
        );
      } else {
        _logger?.d('User is not authenticated');
        emit(const AuthUnauthenticated());
      }
    } catch (e) {
      _logger?.e('Auth check failed', error: e);
      emit(AuthError(
        message: 'Failed to check authentication status',
        type: AuthErrorType.unknown,
      ));
    }
  }

  /// Handle login request
  Future<void> _onAuthLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      _logger?.d('Login requested for: ${event.email}');
      emit(const AuthActionInProgress(AuthAction.login));

      final result = await _authRepository.login(
        email: event.email,
        password: event.password,
      );

      result.fold(
        (failure) {
          _logger?.w('Login failed: ${failure.message}');
          emit(AuthError(
            message: failure.message,
            type: _mapFailureToErrorType(failure.message),
          ));
        },
        (authResponse) {
          _logger?.i('Login successful: ${authResponse.user.email}');
          emit(AuthAuthenticated(authResponse.user));
        },
      );
    } catch (e) {
      _logger?.e('Login error', error: e);
      emit(const AuthError(
        message: 'An unexpected error occurred during login',
        type: AuthErrorType.unknown,
      ));
    }
  }

  /// Handle register request
  Future<void> _onAuthRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      _logger?.d('Registration requested for: ${event.email}');
      emit(const AuthActionInProgress(AuthAction.register));

      final result = await _authRepository.register(
        email: event.email,
        password: event.password,
        firstName: event.firstName,
        lastName: event.lastName,
      );

      result.fold(
        (failure) {
          _logger?.w('Registration failed: ${failure.message}');
          emit(AuthError(
            message: failure.message,
            type: _mapFailureToErrorType(failure.message),
          ));
        },
        (authResponse) {
          _logger?.i('Registration successful: ${authResponse.user.email}');
          emit(AuthAuthenticated(authResponse.user));
        },
      );
    } catch (e) {
      _logger?.e('Registration error', error: e);
      emit(const AuthError(
        message: 'An unexpected error occurred during registration',
        type: AuthErrorType.unknown,
      ));
    }
  }

  /// Handle logout request
  Future<void> _onAuthLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      _logger?.d('Logout requested');
      emit(const AuthActionInProgress(AuthAction.logout));

      final result = await _authRepository.logout();

      result.fold(
        (failure) {
          _logger?.w('Logout failed: ${failure.message}');
          // Even if logout fails, clear the session locally
          emit(const AuthUnauthenticated(message: 'Logged out'));
        },
        (_) {
          _logger?.i('Logout successful');
          emit(const AuthUnauthenticated(message: 'Logged out successfully'));
        },
      );
    } catch (e) {
      _logger?.e('Logout error', error: e);
      // On error, still log out locally
      emit(const AuthUnauthenticated(message: 'Logged out'));
    }
  }

  /// Handle user refresh request
  Future<void> _onAuthUserRefreshRequested(
    AuthUserRefreshRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      _logger?.d('User refresh requested');
      
      // Keep current authenticated state while refreshing
      if (state is AuthAuthenticated) {
        emit(const AuthActionInProgress(AuthAction.refresh));
      }

      final result = await _authRepository.getCurrentUser();
      result.fold(
        (failure) {
          _logger?.w('User data refresh failed: ${failure.message}');
          emit(const AuthUnauthenticated(message: 'Session expired'));
        },
        (user) {
          _logger?.i('User data refreshed: ${user.email}');
          emit(AuthAuthenticated(user));
        },
      );
    } catch (e) {
      _logger?.e('User refresh error', error: e);
      emit(const AuthError(
        message: 'Failed to refresh user data',
        type: AuthErrorType.unknown,
      ));
    }
  }

  /// Handle session restore request (on app startup)
  Future<void> _onAuthSessionRestoreRequested(
    AuthSessionRestoreRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      _logger?.d('Session restore requested');
      emit(const AuthActionInProgress(AuthAction.sessionRestore));

      final isAuthenticated = await _authRepository.isAuthenticated();

      if (isAuthenticated) {
        final result = await _authRepository.getCurrentUser();
        if (result.isLeft()) {
          _logger?.w('Token exists but user data invalid');
          await _authRepository.logout();
          emit(const AuthUnauthenticated(message: 'Session expired'));
        } else {
          final user = result.getOrElse(
            () => throw StateError('User expected when session restore succeeds'),
          );
          _logger?.i('Session restored: ${user.email}');
          emit(AuthAuthenticated(user));
        }
      } else {
        _logger?.d('No session to restore');
        emit(const AuthUnauthenticated());
      }
    } catch (e) {
      _logger?.e('Session restore error', error: e);
      emit(const AuthUnauthenticated(message: 'Failed to restore session'));
    }
  }

  /// Map failure message to error type
  AuthErrorType _mapFailureToErrorType(String message) {
    final lowerMessage = message.toLowerCase();

    if (lowerMessage.contains('credential') ||
        lowerMessage.contains('password') ||
        lowerMessage.contains('email') ||
        lowerMessage.contains('invalid')) {
      return AuthErrorType.invalidCredentials;
    }

    if (lowerMessage.contains('network') ||
        lowerMessage.contains('connection') ||
        lowerMessage.contains('timeout')) {
      return AuthErrorType.networkError;
    }

    if (lowerMessage.contains('server') ||
        lowerMessage.contains('500') ||
        lowerMessage.contains('503')) {
      return AuthErrorType.serverError;
    }

    if (lowerMessage.contains('validation') ||
        lowerMessage.contains('required') ||
        lowerMessage.contains('format')) {
      return AuthErrorType.validationError;
    }

    return AuthErrorType.unknown;
  }
}

import 'package:equatable/equatable.dart';

import '../../domain/entities/user.dart';

/// Base class for all authentication states
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

/// Initial state when the app starts
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// State when checking authentication status
class AuthLoading extends AuthState {
  const AuthLoading();
}

/// State when user is authenticated
class AuthAuthenticated extends AuthState {
  final User user;

  const AuthAuthenticated(this.user);

  @override
  List<Object?> get props => [user];
}

/// State when user is not authenticated
class AuthUnauthenticated extends AuthState {
  final String? message;

  const AuthUnauthenticated({this.message});

  @override
  List<Object?> get props => [message];
}

/// State when authentication fails
class AuthError extends AuthState {
  final String message;
  final AuthErrorType type;

  const AuthError({
    required this.message,
    this.type = AuthErrorType.unknown,
  });

  @override
  List<Object?> get props => [message, type];
}

/// State when login/register is in progress
class AuthActionInProgress extends AuthState {
  final AuthAction action;

  const AuthActionInProgress(this.action);

  @override
  List<Object?> get props => [action];
}

/// Types of authentication errors
enum AuthErrorType {
  invalidCredentials,
  networkError,
  serverError,
  validationError,
  unknown,
}

/// Types of authentication actions
enum AuthAction {
  login,
  register,
  logout,
  sessionRestore,
  refresh,
}

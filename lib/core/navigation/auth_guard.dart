import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/bloc/auth_state.dart';
import '../../config/routes/app_routes.dart';

/// Widget that guards routes requiring authentication
/// Redirects to login if user is not authenticated
class AuthGuard extends StatelessWidget {
  final Widget child;
  final bool checkOnInit;

  const AuthGuard({
    super.key,
    required this.child,
    this.checkOnInit = true,
  });

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        // Redirect to login when user becomes unauthenticated
        if (state is AuthUnauthenticated) {
          Navigator.of(context).pushNamedAndRemoveUntil(
            AppRoutes.login,
            (route) => false,
          );
        }
      },
      builder: (context, state) {
        // Show loading while checking auth status
        if (state is AuthInitial || state is AuthLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // Show child if authenticated
        if (state is AuthAuthenticated) {
          return child;
        }

        // Show loading for action in progress
        if (state is AuthActionInProgress) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // For any other state (error, unauthenticated), show loading
        // The listener will handle navigation to login
        return const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        );
      },
    );
  }
}

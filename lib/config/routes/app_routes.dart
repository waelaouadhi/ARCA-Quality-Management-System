import 'package:flutter/material.dart';

import '../../core/models/enums.dart';
import '../../features/auth/presentation/pages/pages.dart';
import '../../core/navigation/main_layout.dart';

/// QMS Application Routes
/// Centralized route configuration
class AppRoutes {
  AppRoutes._();

  // ============ Route Names ============
  
  // Auth Routes
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';
  static const String verifyEmail = '/verify-email';
  static const String onboarding = '/onboarding';

  // Main Routes
  static const String home = '/home';
  static const String dashboard = '/dashboard';
  
  // Document Management
  static const String documents = '/documents';
  static const String documentDetails = '/documents/:id';
  static const String documentCreate = '/documents/create';
  static const String documentEdit = '/documents/:id/edit';
  
  // Non-Conformance Management
  static const String nonConformances = '/non-conformances';
  static const String ncDetails = '/non-conformances/:id';
  static const String ncCreate = '/non-conformances/create';
  static const String ncEdit = '/non-conformances/:id/edit';
  
  // Corrective Actions
  static const String correctiveActions = '/corrective-actions';
  static const String caDetails = '/corrective-actions/:id';
  static const String caCreate = '/corrective-actions/create';
  static const String caEdit = '/corrective-actions/:id/edit';
  
  // Escalation
  static const String escalationDashboard = '/escalation';
  static const String escalationDetails = '/escalation/:id';
  static const String slaConfig = '/sla-config';
  
  // User Management
  static const String users = '/users';
  static const String userDetails = '/users/:id';
  static const String userEdit = '/users/:id/edit';
  
  // Settings & Profile
  static const String settings = '/settings';
  static const String profile = '/profile';
  static const String profileEdit = '/profile/edit';
  static const String notifications = '/notifications';
  
  // Error Routes
  static const String notFound = '/404';
  static const String error = '/error';
  static const String unauthorized = '/unauthorized';

  // ============ Helper Methods ============
  
  /// Generate route with path parameters
  static String documentDetailsPath(String id) => '/documents/$id';
  static String documentEditPath(String id) => '/documents/$id/edit';
  static String ncDetailsPath(String id) => '/non-conformances/$id';
  static String ncEditPath(String id) => '/non-conformances/$id/edit';
  static String caDetailsPath(String id) => '/corrective-actions/$id';
  static String caEditPath(String id) => '/corrective-actions/$id/edit';
  static String escalationDetailsPath(String id) => '/escalation/$id';
  static String userDetailsPath(String id) => '/users/$id';
  static String userEditPath(String id) => '/users/$id/edit';

  /// Routes that don't require authentication
  static const List<String> publicRoutes = [
    splash,
    login,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    onboarding,
  ];

  /// Check if route requires authentication
  static bool requiresAuth(String route) {
    return !publicRoutes.contains(route);
  }
}

/// Route guard for role-based access control
class RouteGuard {
  RouteGuard._();

  /// Routes requiring ADMIN role
  static const List<String> adminOnlyRoutes = [
    AppRoutes.slaConfig,
    AppRoutes.users,
  ];

  /// Routes requiring at least MANAGER role
  static const List<String> managerRoutes = [
    AppRoutes.escalationDashboard,
    AppRoutes.userDetails,
    AppRoutes.userEdit,
  ];

  /// Check if user can access route
  static bool canAccess(String route, UserRole? role) {
    if (role == null) {
      return !AppRoutes.requiresAuth(route);
    }

    // Admin can access everything
    if (role.isAdmin) return true;

    // Check admin-only routes
    if (_matchesAny(route, adminOnlyRoutes)) {
      return false;
    }

    // Check manager routes
    if (_matchesAny(route, managerRoutes)) {
      return role.isManager || role.isAdmin;
    }

    // All authenticated users can access other routes
    return true;
  }

  /// Get redirect route if access denied
  static String? getRedirectRoute(String route, UserRole? role) {
    if (role == null) {
      if (AppRoutes.requiresAuth(route)) {
        return AppRoutes.login;
      }
      return null;
    }

    if (!canAccess(route, role)) {
      return AppRoutes.unauthorized;
    }

    return null;
  }

  /// Check if route matches any in list (handles path parameters)
  static bool _matchesAny(String route, List<String> routes) {
    for (final pattern in routes) {
      if (_routeMatches(route, pattern)) {
        return true;
      }
    }
    return false;
  }

  /// Check if route matches pattern (handles :id style params)
  static bool _routeMatches(String route, String pattern) {
    final routeParts = route.split('/');
    final patternParts = pattern.split('/');

    if (routeParts.length != patternParts.length) {
      // Check if route starts with pattern (for nested routes)
      return route.startsWith(pattern.replaceAll(':id', ''));
    }

    for (var i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) continue;
      if (routeParts[i] != patternParts[i]) return false;
    }

    return true;
  }
}

/// Route generator for MaterialApp
class AppRouter {
  AppRouter._();

  /// Generate routes
  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return _buildRoute(
          settings,
          const SplashPage(),
        );
      
      case AppRoutes.login:
        return _buildRoute(
          settings,
          const LoginPage(),
        );
      
      case AppRoutes.register:
        return _buildRoute(
          settings,
          const RegisterPage(),
        );
      
      case AppRoutes.dashboard:
      case AppRoutes.home:
        return _buildRoute(
          settings,
          const MainLayout(initialIndex: 0),
        );
      
      case AppRoutes.documents:
        return _buildRoute(
          settings,
          const _PlaceholderScreen(title: 'Documents'),
        );
      
      case AppRoutes.nonConformances:
        return _buildRoute(
          settings,
          const _PlaceholderScreen(title: 'Non-Conformances'),
        );
      
      case AppRoutes.correctiveActions:
        return _buildRoute(
          settings,
          const _PlaceholderScreen(title: 'Corrective Actions'),
        );
      
      case AppRoutes.escalationDashboard:
        return _buildRoute(
          settings,
          const _PlaceholderScreen(title: 'Escalation Dashboard'),
        );
      
      case AppRoutes.slaConfig:
        return _buildRoute(
          settings,
          const _PlaceholderScreen(title: 'SLA Configuration'),
        );
      
      case AppRoutes.users:
        return _buildRoute(
          settings,
          const MainLayout(initialIndex: 1),
        );
      
      case AppRoutes.settings:
        return _buildRoute(
          settings,
          const MainLayout(initialIndex: 2),
        );
      
      case AppRoutes.profile:
        return _buildRoute(
          settings,
          const _PlaceholderScreen(title: 'Profile'),
        );
      
      case AppRoutes.notifications:
        return _buildRoute(
          settings,
          const _PlaceholderScreen(title: 'Notifications'),
        );
      
      case AppRoutes.unauthorized:
        return _buildRoute(
          settings,
          const _UnauthorizedScreen(),
        );
      
      default:
        // Handle dynamic routes
        if (settings.name?.startsWith('/documents/') ?? false) {
          final id = _extractId(settings.name!, '/documents/');
          return _buildRoute(
            settings,
            _PlaceholderScreen(title: 'Document $id'),
          );
        }
        
        if (settings.name?.startsWith('/non-conformances/') ?? false) {
          final id = _extractId(settings.name!, '/non-conformances/');
          return _buildRoute(
            settings,
            _PlaceholderScreen(title: 'NC $id'),
          );
        }
        
        if (settings.name?.startsWith('/corrective-actions/') ?? false) {
          final id = _extractId(settings.name!, '/corrective-actions/');
          return _buildRoute(
            settings,
            _PlaceholderScreen(title: 'CA $id'),
          );
        }
        
        if (settings.name?.startsWith('/users/') ?? false) {
          final id = _extractId(settings.name!, '/users/');
          return _buildRoute(
            settings,
            _PlaceholderScreen(title: 'User $id'),
          );
        }
        
        if (settings.name?.startsWith('/escalation/') ?? false) {
          final id = _extractId(settings.name!, '/escalation/');
          return _buildRoute(
            settings,
            _PlaceholderScreen(title: 'Escalation $id'),
          );
        }
        
        // 404 Not Found
        return _buildRoute(
          settings,
          const _NotFoundScreen(),
        );
    }
  }

  /// Extract ID from route path
  static String _extractId(String path, String prefix) {
    final remaining = path.substring(prefix.length);
    final slashIndex = remaining.indexOf('/');
    if (slashIndex == -1) return remaining;
    return remaining.substring(0, slashIndex);
  }

  /// Build a MaterialPageRoute
  static MaterialPageRoute<T> _buildRoute<T>(
    RouteSettings settings,
    Widget page, {
    bool fullscreenDialog = false,
  }) {
    return MaterialPageRoute<T>(
      settings: settings,
      builder: (_) => page,
      fullscreenDialog: fullscreenDialog,
    );
  }

}

/// Placeholder screen for unimplemented routes
class _PlaceholderScreen extends StatelessWidget {
  final String title;

  const _PlaceholderScreen({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.construction,
              size: 64,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Coming Soon',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 404 Not Found screen
class _NotFoundScreen extends StatelessWidget {
  const _NotFoundScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '404',
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                color: Theme.of(context).colorScheme.error,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Page Not Found',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
                AppRoutes.home,
                (route) => false,
              ),
              icon: const Icon(Icons.home),
              label: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Unauthorized access screen
class _UnauthorizedScreen extends StatelessWidget {
  const _UnauthorizedScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.lock_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Access Denied',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'You don\'t have permission to access this page',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }
}

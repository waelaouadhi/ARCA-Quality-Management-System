import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart' as gql_flutter;
import 'package:flutter/services.dart';

import 'core/api/graphql/graphql_client.dart';
import 'core/theme/app_theme.dart';
import 'config/routes/app_routes.dart';
import 'config/environment/environment.dart';
import 'config/di/injection.dart';
import 'features/auth/data/datasources/auth_remote_datasource.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/data/services/auth_storage_service.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';

void main() async {
  // Ensure Flutter binding is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations for all platforms
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // Initialize environment configuration
  AppEnvironment.initialize(Environment.development);

  // Initialize dependency injection
  await initDependencies();

  // Run the application
  runApp(const QMSApp());
}

/// QMS Application Root Widget
class QMSApp extends StatelessWidget {
  const QMSApp({super.key});

  @override
  Widget build(BuildContext context) {
    if (!sl.isRegistered<GraphQLClientFactory>()) {
      return MaterialApp(
        title: AppEnvironment.appName,
        debugShowCheckedModeBanner: AppEnvironment.isDebugMode,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const Scaffold(
          body: Center(
            child: Text('QMS'),
          ),
        ),
      );
    }

    return FutureBuilder<gql_flutter.GraphQLClient>(
      future: sl<GraphQLClientFactory>().client,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const MaterialApp(
            home: Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        final authRepository = AuthRepositoryImpl(
          remoteDataSource: AuthRemoteDataSourceImpl(
            client: snapshot.data!,
            logger: sl(),
          ),
          storageService: AuthStorageService(
            secureStorage: sl(),
          ),
          logger: sl(),
        );

        return BlocProvider<AuthBloc>(
          create: (_) => AuthBloc(
            authRepository: authRepository,
            logger: sl(),
          )..add(const AuthSessionRestoreRequested()),
          child: MaterialApp(
            title: AppEnvironment.appName,
            debugShowCheckedModeBanner: AppEnvironment.isDebugMode,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.system,
            initialRoute: AppRoutes.splash,
            onGenerateRoute: AppRouter.generateRoute,
          ),
        );
      },
    );
  }
}

/// QMS Home Page - Splash/Welcome Screen
class QMSHomePage extends StatelessWidget {
  const QMSHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QMS - Quality Management System'),
        centerTitle: true,
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
        foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.pushNamed(context, AppRoutes.settings);
            },
            tooltip: 'Settings',
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // QMS Logo/Icon
              Icon(
                Icons.verified_outlined,
                size: 120,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(height: 32),

              // Title
              Text(
                'Quality Management System',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),

              // Subtitle
              Text(
                'Production-Grade QMS Application',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),

              // Environment Info
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.secondaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.computer,
                      size: 16,
                      color: Theme.of(context).colorScheme.onSecondaryContainer,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Environment: ${AppEnvironment.config.environment.name.toUpperCase()}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Theme.of(context).colorScheme.onSecondaryContainer,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // Action Cards
              SizedBox(
                width: 500,
                child: Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.rocket_launch,
                          size: 48,
                          color: Colors.deepPurple,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Get Started',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Access the authentication system and core modules',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        
                        // Login Button
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () {
                              Navigator.pushNamed(context, AppRoutes.login);
                            },
                            icon: const Icon(Icons.login),
                            label: const Text('Login'),
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        
                        // Register Button
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.pushNamed(context, AppRoutes.register);
                            },
                            icon: const Icon(Icons.person_add),
                            label: const Text('Register'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Quick Access
              Text(
                'Quick Access',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                alignment: WrapAlignment.center,
                children: [
                  _QuickAccessChip(
                    icon: Icons.dashboard,
                    label: 'Dashboard',
                    onTap: () => Navigator.pushNamed(context, AppRoutes.dashboard),
                  ),
                  _QuickAccessChip(
                    icon: Icons.description,
                    label: 'Documents',
                    onTap: () => Navigator.pushNamed(context, AppRoutes.documents),
                  ),
                  _QuickAccessChip(
                    icon: Icons.warning,
                    label: 'Non-Conformances',
                    onTap: () => Navigator.pushNamed(context, AppRoutes.nonConformances),
                  ),
                  _QuickAccessChip(
                    icon: Icons.assignment,
                    label: 'Corrective Actions',
                    onTap: () => Navigator.pushNamed(context, AppRoutes.correctiveActions),
                  ),
                  _QuickAccessChip(
                    icon: Icons.people,
                    label: 'Users',
                    onTap: () => Navigator.pushNamed(context, AppRoutes.users),
                  ),
                ],
              ),
              const SizedBox(height: 48),

              // Backend Info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.cloud_outlined,
                          size: 20,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Backend Configuration',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'GraphQL: ${AppEnvironment.graphqlEndpoint}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontFamily: 'monospace',
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'REST API: ${AppEnvironment.restBaseUrl}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontFamily: 'monospace',
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Quick Access Chip Widget
class _QuickAccessChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickAccessChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 20),
      label: Text(label),
      onPressed: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    );
  }
}

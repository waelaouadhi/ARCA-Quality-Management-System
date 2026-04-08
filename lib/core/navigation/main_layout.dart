import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart' as gql_flutter;

import '../../config/di/injection.dart';
import '../../core/api/graphql/graphql_client.dart';
import '../../features/dashboard/dashboard_page.dart';
import '../../features/settings/settings_page.dart';
import '../../features/users/data/datasources/users_remote_datasource.dart';
import '../../features/users/data/repositories/users_repository_impl.dart';
import '../../features/users/domain/usecases/delete_user_usecase.dart';
import '../../features/users/domain/usecases/get_user_by_id_usecase.dart';
import '../../features/users/domain/usecases/get_users_usecase.dart';
import '../../features/users/domain/usecases/update_user_usecase.dart';
import '../../features/users/presentation/bloc/bloc.dart';
import '../../features/users/presentation/pages/users_list_page.dart';
import '../navigation/auth_guard.dart';

/// Main layout with bottom navigation bar
class MainLayout extends StatefulWidget {
  final int initialIndex;

  const MainLayout({
    super.key,
    this.initialIndex = 0,
  });

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  late int _currentIndex;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthGuard(
      child: Scaffold(
        body: PageView(
          controller: _pageController,
          onPageChanged: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          children: const [
            DashboardPage(),
            _UsersTab(),
            SettingsPage(),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) {
            setState(() {
              _currentIndex = index;
            });
            _pageController.animateToPage(
              index,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            NavigationDestination(
              icon: Badge(
                label: Text('3'),
                child: Icon(Icons.people_outline),
              ),
              selectedIcon: Badge(
                label: Text('3'),
                child: Icon(Icons.people),
              ),
              label: 'Users',
            ),
            NavigationDestination(
              icon: Icon(Icons.settings_outlined),
              selectedIcon: Icon(Icons.settings),
              label: 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}

class _UsersTab extends StatelessWidget {
  const _UsersTab();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<gql_flutter.GraphQLClient>(
      future: sl<GraphQLClientFactory>().client,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final remoteDataSource = UsersRemoteDataSourceImpl(
          client: snapshot.data!,
          logger: sl(),
        );
        final repository = UsersRepositoryImpl(
          remoteDataSource: remoteDataSource,
          logger: sl(),
        );

        return BlocProvider<UsersBloc>(
          create: (_) => UsersBloc(
            getUsersUseCase: GetUsersUseCase(repository),
            getUserByIdUseCase: GetUserByIdUseCase(repository),
            updateUserUseCase: UpdateUserUseCase(repository),
            deleteUserUseCase: DeleteUserUseCase(repository),
            logger: sl(),
          ),
          child: const UsersListPage(),
        );
      },
    );
  }
}

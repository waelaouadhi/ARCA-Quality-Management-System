import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../auth/domain/entities/user.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../bloc/bloc.dart';
import '../widgets/empty_users_state.dart';
import '../widgets/user_card.dart';
import '../widgets/user_list_shimmer.dart';
import 'user_detail_page.dart';

/// Page to display paginated list of users
class UsersListPage extends StatefulWidget {
  const UsersListPage({super.key});

  @override
  State<UsersListPage> createState() => _UsersListPageState();
}

class _UsersListPageState extends State<UsersListPage> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  String? _selectedRoleFilter;

  @override
  void initState() {
    super.initState();
    // Load initial users
    context.read<UsersBloc>().add(const UsersLoadRequested(page: 1));
    
    // Setup scroll listener for infinite scroll
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isBottom) {
      context.read<UsersBloc>().add(const UsersLoadMoreRequested());
    }
  }

  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    return currentScroll >= (maxScroll * 0.9);
  }

  void _onRefresh() {
    context.read<UsersBloc>().add(const UsersRefreshRequested());
  }

  void _onSearchChanged(String value) {
    context.read<UsersBloc>().add(UsersSearchChanged(value));
  }

  void _onRoleFilterChanged(String? role) {
    setState(() {
      _selectedRoleFilter = role;
    });
    context.read<UsersBloc>().add(UsersRoleFilterChanged(role));
  }

  void _navigateToUserDetail(User user) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => BlocProvider.value(
          value: context.read<UsersBloc>(),
          child: UserDetailPage(userId: user.id),
        ),
      ),
    );
  }

  void _showAddUserMessage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Add user feature coming soon'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    
    // Get current user to determine permissions
    final authState = context.watch<AuthBloc>().state;
    final currentUser = authState is AuthAuthenticated ? authState.user : null;
    final canAddUsers = currentUser?.isAdmin ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Users'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            padding: const EdgeInsets.all(16),
            color: colorScheme.surface,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search users...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: colorScheme.surfaceContainerHighest,
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          
          // Role filter chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('All', null),
                  const SizedBox(width: 8),
                  _buildFilterChip('Admin', UserRole.admin.value),
                  const SizedBox(width: 8),
                  _buildFilterChip('Manager', UserRole.manager.value),
                  const SizedBox(width: 8),
                  _buildFilterChip('User', UserRole.user.value),
                ],
              ),
            ),
          ),
          
          const Divider(height: 1),
          
          // Users list
          Expanded(
            child: BlocConsumer<UsersBloc, UsersState>(
              listener: (context, state) {
                // Show error messages
                if (state is UsersError && !state.retainPreviousData) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(state.message),
                      backgroundColor: colorScheme.error,
                      behavior: SnackBarBehavior.floating,
                      action: SnackBarAction(
                        label: 'Retry',
                        textColor: colorScheme.onError,
                        onPressed: _onRefresh,
                      ),
                    ),
                  );
                }
              },
              builder: (context, state) {
                if (state is UsersLoading) {
                  return const UserListShimmer();
                }
                
                if (state is UsersLoaded) {
                  if (state.isEmpty) {
                    return EmptyUsersState(
                      message: state.currentSearch != null || state.currentRoleFilter != null
                          ? 'No Users Found'
                          : 'No Users Yet',
                      description: state.currentSearch != null || state.currentRoleFilter != null
                          ? 'Try adjusting your search or filters'
                          : null,
                      onRetry: _onRefresh,
                    );
                  }
                  
                  return RefreshIndicator(
                    onRefresh: () async {
                      _onRefresh();
                      await Future.delayed(const Duration(seconds: 1));
                    },
                    child: ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: state.users.length + (state.isLoadingMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        // Show loading indicator at bottom
                        if (index >= state.users.length) {
                          return const Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }
                        
                        final user = state.users[index];
                        return UserCard(
                          user: user,
                          onTap: () => _navigateToUserDetail(user),
                        );
                      },
                    ),
                  );
                }
                
                if (state is UsersError) {
                  return EmptyUsersState(
                    message: 'Failed to Load Users',
                    description: state.message,
                    onRetry: _onRefresh,
                  );
                }
                
                // Initial state
                return const Center(
                  child: CircularProgressIndicator(),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: canAddUsers
          ? FloatingActionButton.extended(
              onPressed: _showAddUserMessage,
              icon: const Icon(Icons.person_add),
              label: const Text('Add User'),
            )
          : null,
    );
  }

  Widget _buildFilterChip(String label, String? roleValue) {
    final isSelected = _selectedRoleFilter == roleValue;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        _onRoleFilterChanged(selected ? roleValue : null);
      },
      backgroundColor: colorScheme.surface,
      selectedColor: colorScheme.primaryContainer,
      checkmarkColor: colorScheme.onPrimaryContainer,
      labelStyle: TextStyle(
        color: isSelected ? colorScheme.onPrimaryContainer : colorScheme.onSurface,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
      side: BorderSide(
        color: isSelected ? colorScheme.primary : colorScheme.outline,
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/utils/formatters.dart';
import '../../../auth/domain/entities/user.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../bloc/bloc.dart';
import '../widgets/role_badge.dart';
import 'user_edit_page.dart';

/// Page to display a single user's details
class UserDetailPage extends StatefulWidget {
  final String userId;

  const UserDetailPage({
    super.key,
    required this.userId,
  });

  @override
  State<UserDetailPage> createState() => _UserDetailPageState();
}

class _UserDetailPageState extends State<UserDetailPage> {
  @override
  void initState() {
    super.initState();
    if (!AppFormatters.isValidId(widget.userId)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid user identifier'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.of(context).pop();
      });
      return;
    }
    // Load user details
    context.read<UsersBloc>().add(UserDetailsLoadRequested(widget.userId));
  }

  void _navigateToEdit(User user) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => BlocProvider.value(
          value: context.read<UsersBloc>(),
          child: UserEditPage(user: user),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(User user) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete User'),
        content: Text(
          'Are you sure you want to delete ${user.fullName}? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      context.read<UsersBloc>().add(UserDeleteRequested(widget.userId));
    }
  }

  bool _canEdit(User currentUser, User targetUser) {
    // Admins can edit all users
    if (currentUser.isAdmin) return true;
    
    // Users cannot edit others
    return false;
  }

  bool _canDelete(User currentUser, User targetUser) {
    // Only admins can delete
    if (!currentUser.isAdmin) return false;
    
    // Cannot delete other admins
    if (targetUser.isAdmin) return false;
    
    // Cannot delete yourself
    if (currentUser.id == targetUser.id) return false;
    
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    
    // Get current user to determine permissions
    final authState = context.watch<AuthBloc>().state;
    final currentUser = authState is AuthAuthenticated ? authState.user : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('User Details'),
        elevation: 0,
      ),
      body: BlocConsumer<UsersBloc, UsersState>(
        listener: (context, state) {
          if (state is UserActionSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: colorScheme.primary,
                behavior: SnackBarBehavior.floating,
              ),
            );
            
            // Navigate back after delete
            if (state.action == 'delete') {
              Navigator.of(context).pop();
            }
          }
          
          if (state is UsersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: colorScheme.error,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is UsersLoading || state is UserActionInProgress) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }
          
          if (state is UserDetailsLoaded) {
            final user = state.user;
            final canEdit = currentUser != null && _canEdit(currentUser, user);
            final canDelete = currentUser != null && _canDelete(currentUser, user);

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // User avatar and basic info card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          // Avatar
                          CircleAvatar(
                            radius: 48,
                            backgroundColor: colorScheme.primaryContainer,
                            foregroundColor: colorScheme.onPrimaryContainer,
                            child: Text(
                              user.initials,
                              style: theme.textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: colorScheme.onPrimaryContainer,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Full name
                          Text(
                            user.fullName,
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          
                          // Email
                          Text(
                            user.email,
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          
                          // Role badge
                          RoleBadge(role: user.role),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Details card
                  Card(
                    child: Column(
                      children: [
                        _buildDetailRow(
                          context,
                          icon: Icons.badge_outlined,
                          label: 'User ID',
                           value: AppFormatters.formatUserFacingId(
                             user.id,
                             prefix: 'USR',
                           ),
                        ),
                        const Divider(height: 1),
                        _buildDetailRow(
                          context,
                          icon: Icons.person_outline,
                          label: 'First Name',
                          value: user.firstName,
                        ),
                        const Divider(height: 1),
                        _buildDetailRow(
                          context,
                          icon: Icons.person_outline,
                          label: 'Last Name',
                          value: user.lastName,
                        ),
                        const Divider(height: 1),
                        _buildDetailRow(
                          context,
                          icon: Icons.calendar_today_outlined,
                          label: 'Joined',
                           value: AppFormatters.formatDateTime(user.createdAt),
                        ),
                        const Divider(height: 1),
                        _buildDetailRow(
                          context,
                          icon: Icons.update_outlined,
                          label: 'Last Updated',
                           value: AppFormatters.formatDateTime(user.updatedAt),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Actions
                  if (canEdit || canDelete) ...[
                    if (canEdit)
                      FilledButton.icon(
                        onPressed: () => _navigateToEdit(user),
                        icon: const Icon(Icons.edit),
                        label: const Text('Edit User'),
                      ),
                    
                    if (canEdit && canDelete) const SizedBox(height: 12),
                    
                    if (canDelete)
                      OutlinedButton.icon(
                        onPressed: () => _confirmDelete(user),
                        icon: const Icon(Icons.delete_outline),
                        label: const Text('Delete User'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: colorScheme.error,
                        ),
                      ),
                  ],
                ],
              ),
            );
          }
          
          if (state is UsersError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: colorScheme.error,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to Load User',
                      style: theme.textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      state.message,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: () {
                        context.read<UsersBloc>().add(
                          UserDetailsLoadRequested(widget.userId),
                        );
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }
          
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

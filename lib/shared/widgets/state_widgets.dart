import 'package:flutter/material.dart';
import 'app_icons.dart';

/// Different states for UI components
enum ViewState { loading, success, error, empty }

/// Loading state widget with customizable message
class LoadingView extends StatelessWidget {
  final String? message;

  const LoadingView({
    super.key,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(
              theme.colorScheme.primary,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

/// Empty state widget with icon, title, and subtitle
class EmptyView extends StatelessWidget {
  final String? icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const EmptyView({
    super.key,
    this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              ThemedIcons.icon(
                context,
                icon!,
                size: IconSizes.xxl,
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
              ),
              const SizedBox(height: 24),
            ],
            Text(
              title,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7),
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 24),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Error state widget with retry functionality
class ErrorView extends StatelessWidget {
  final String? icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onRetry;
  final String? retryButtonText;

  const ErrorView({
    super.key,
    this.icon,
    required this.title,
    this.subtitle,
    this.onRetry,
    this.retryButtonText,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ThemedIcons.error(
              context,
              icon ?? AppIcons.error,
              size: IconSizes.xxl,
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: theme.colorScheme.error,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: ThemedIcons.icon(
                  context,
                  AppIcons.refresh,
                  size: IconSizes.sm,
                ),
                label: Text(retryButtonText ?? 'Try Again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Adaptive view that switches between different states
class AdaptiveView extends StatelessWidget {
  final ViewState state;
  final Widget? loadingWidget;
  final Widget? emptyWidget;
  final Widget? errorWidget;
  final Widget successWidget;
  final String? loadingMessage;
  final String? emptyTitle;
  final String? emptySubtitle;
  final Widget? emptyAction;
  final String? errorTitle;
  final String? errorSubtitle;
  final VoidCallback? onRetry;

  const AdaptiveView({
    super.key,
    required this.state,
    required this.successWidget,
    this.loadingWidget,
    this.emptyWidget,
    this.errorWidget,
    this.loadingMessage,
    this.emptyTitle,
    this.emptySubtitle,
    this.emptyAction,
    this.errorTitle,
    this.errorSubtitle,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    switch (state) {
      case ViewState.loading:
        return loadingWidget ?? LoadingView(message: loadingMessage);
      
      case ViewState.empty:
        return emptyWidget ??
            EmptyView(
              title: emptyTitle ?? 'No data available',
              subtitle: emptySubtitle,
              action: emptyAction,
            );
      
      case ViewState.error:
        return errorWidget ??
            ErrorView(
              title: errorTitle ?? 'Something went wrong',
              subtitle: errorSubtitle,
              onRetry: onRetry,
            );
      
      case ViewState.success:
        return successWidget;
    }
  }
}

/// Shimmer loading effect for list items
class ShimmerListItem extends StatefulWidget {
  final double height;
  final EdgeInsets margin;

  const ShimmerListItem({
    super.key,
    this.height = 80.0,
    this.margin = const EdgeInsets.symmetric(
      horizontal: 16.0,
      vertical: 8.0,
    ),
  });

  @override
  State<ShimmerListItem> createState() => _ShimmerListItemState();
}

class _ShimmerListItemState extends State<ShimmerListItem>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _animation = Tween<double>(
      begin: -1.0,
      end: 2.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _animationController.repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          height: widget.height,
          margin: widget.margin,
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(8.0),
            border: Border.all(
              color: theme.dividerColor,
              width: 1,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8.0),
            child: Stack(
              children: [
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          theme.colorScheme.surfaceVariant.withOpacity(0.3),
                          theme.colorScheme.surfaceVariant.withOpacity(0.1),
                          theme.colorScheme.surfaceVariant.withOpacity(0.3),
                        ],
                        stops: [
                          _animation.value - 0.3,
                          _animation.value,
                          _animation.value + 0.3,
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Pre-built empty states for different modules
class ModuleEmptyStates {
  /// Empty state for users list
  static Widget users(BuildContext context, {VoidCallback? onAddUser}) {
    return EmptyView(
      icon: AppIcons.users,
      title: 'No users found',
      subtitle: 'Get started by adding your first user to the system.',
      action: onAddUser != null
          ? ElevatedButton.icon(
              onPressed: onAddUser,
              icon: ThemedIcons.icon(context, AppIcons.addUser, size: IconSizes.sm),
              label: const Text('Add User'),
            )
          : null,
    );
  }

  /// Empty state for documents list
  static Widget documents(BuildContext context, {VoidCallback? onAddDocument}) {
    return EmptyView(
      icon: AppIcons.document,
      title: 'No documents found',
      subtitle: 'Create your first document to get started with document management.',
      action: onAddDocument != null
          ? ElevatedButton.icon(
              onPressed: onAddDocument,
              icon: ThemedIcons.icon(context, AppIcons.addDocument, size: IconSizes.sm),
              label: const Text('Add Document'),
            )
          : null,
    );
  }

  /// Empty state for non-conformances list
  static Widget nonConformances(BuildContext context, {VoidCallback? onAddNC}) {
    return EmptyView(
      icon: AppIcons.nonConformance,
      title: 'No non-conformances found',
      subtitle: 'Track and manage quality issues by reporting non-conformances.',
      action: onAddNC != null
          ? ElevatedButton.icon(
              onPressed: onAddNC,
              icon: ThemedIcons.icon(context, AppIcons.addNonConformance, size: IconSizes.sm),
              label: const Text('Report Issue'),
            )
          : null,
    );
  }

  /// Empty state for corrective actions list
  static Widget correctiveActions(BuildContext context, {VoidCallback? onAddAction}) {
    return EmptyView(
      icon: AppIcons.correctiveAction,
      title: 'No corrective actions found',
      subtitle: 'Create action items to address quality issues and improvements.',
      action: onAddAction != null
          ? ElevatedButton.icon(
              onPressed: onAddAction,
              icon: ThemedIcons.icon(context, AppIcons.addAction, size: IconSizes.sm),
              label: const Text('Add Action'),
            )
          : null,
    );
  }
}
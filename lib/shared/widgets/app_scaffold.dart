import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

/// QMS Design System Scaffold Wrapper
/// Provides consistent layout across the application
class AppScaffold extends StatelessWidget {
  final String? title;
  final Widget body;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final List<Widget>? actions;
  final Widget? leading;
  final Widget? bottomNavigationBar;
  final Widget? drawer;
  final Widget? endDrawer;
  final bool showAppBar;
  final bool centerTitle;
  final bool automaticallyImplyLeading;
  final Color? backgroundColor;
  final PreferredSizeWidget? bottom;
  final VoidCallback? onBack;
  final bool resizeToAvoidBottomInset;
  final bool extendBody;
  final bool extendBodyBehindAppBar;

  const AppScaffold({
    super.key,
    this.title,
    required this.body,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.actions,
    this.leading,
    this.bottomNavigationBar,
    this.drawer,
    this.endDrawer,
    this.showAppBar = true,
    this.centerTitle = false,
    this.automaticallyImplyLeading = true,
    this.backgroundColor,
    this.bottom,
    this.onBack,
    this.resizeToAvoidBottomInset = true,
    this.extendBody = false,
    this.extendBodyBehindAppBar = false,
  });

  /// Scaffold with a custom app bar widget
  factory AppScaffold.custom({
    Key? key,
    required Widget body,
    required PreferredSizeWidget appBar,
    Widget? floatingActionButton,
    FloatingActionButtonLocation? floatingActionButtonLocation,
    Widget? bottomNavigationBar,
    Widget? drawer,
    Widget? endDrawer,
    Color? backgroundColor,
    bool resizeToAvoidBottomInset = true,
    bool extendBody = false,
    bool extendBodyBehindAppBar = false,
  }) {
    return _CustomAppBarScaffold(
      key: key,
      appBar: appBar,
      body: body,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
      bottomNavigationBar: bottomNavigationBar,
      drawer: drawer,
      endDrawer: endDrawer,
      backgroundColor: backgroundColor,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      extendBody: extendBody,
      extendBodyBehindAppBar: extendBodyBehindAppBar,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: showAppBar ? _buildAppBar(context) : null,
      body: body,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
      bottomNavigationBar: bottomNavigationBar,
      drawer: drawer,
      endDrawer: endDrawer,
      backgroundColor: backgroundColor ?? AppColors.background,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      extendBody: extendBody,
      extendBodyBehindAppBar: extendBodyBehindAppBar,
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: title != null ? Text(title!) : null,
      centerTitle: centerTitle,
      automaticallyImplyLeading: automaticallyImplyLeading,
      leading: _buildLeading(context),
      actions: actions,
      bottom: bottom,
    );
  }

  Widget? _buildLeading(BuildContext context) {
    if (leading != null) return leading;
    if (onBack != null) {
      return IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: onBack,
      );
    }
    return null;
  }
}

/// Custom scaffold with custom app bar widget
class _CustomAppBarScaffold extends AppScaffold {
  final PreferredSizeWidget appBar;

  const _CustomAppBarScaffold({
    super.key,
    required this.appBar,
    required super.body,
    super.floatingActionButton,
    super.floatingActionButtonLocation,
    super.bottomNavigationBar,
    super.drawer,
    super.endDrawer,
    super.backgroundColor,
    super.resizeToAvoidBottomInset,
    super.extendBody,
    super.extendBodyBehindAppBar,
  }) : super(showAppBar: false);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar,
      body: body,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
      bottomNavigationBar: bottomNavigationBar,
      drawer: drawer,
      endDrawer: endDrawer,
      backgroundColor: backgroundColor ?? AppColors.background,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      extendBody: extendBody,
      extendBodyBehindAppBar: extendBodyBehindAppBar,
    );
  }
}

/// Responsive scaffold that adapts to screen size
class AppResponsiveScaffold extends StatelessWidget {
  final String? title;
  final Widget mobileBody;
  final Widget? tabletBody;
  final Widget? desktopBody;
  final Widget? floatingActionButton;
  final List<Widget>? actions;
  final Widget? bottomNavigationBar;
  final Widget? drawer;
  final Widget? navigationRail;
  final List<NavigationRailDestination>? railDestinations;
  final int selectedIndex;
  final ValueChanged<int>? onDestinationSelected;
  final bool showRailOnMobile;

  const AppResponsiveScaffold({
    super.key,
    this.title,
    required this.mobileBody,
    this.tabletBody,
    this.desktopBody,
    this.floatingActionButton,
    this.actions,
    this.bottomNavigationBar,
    this.drawer,
    this.navigationRail,
    this.railDestinations,
    this.selectedIndex = 0,
    this.onDestinationSelected,
    this.showRailOnMobile = false,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isDesktop = screenWidth >= 1200;
    final isTablet = screenWidth >= 600 && screenWidth < 1200;

    Widget body;
    if (isDesktop && desktopBody != null) {
      body = desktopBody!;
    } else if (isTablet && tabletBody != null) {
      body = tabletBody!;
    } else {
      body = mobileBody;
    }

    // On larger screens, show navigation rail
    if ((isTablet || isDesktop) && railDestinations != null) {
      return Scaffold(
        appBar: AppBar(
          title: title != null ? Text(title!) : null,
          actions: actions,
        ),
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: selectedIndex,
              onDestinationSelected: onDestinationSelected,
              destinations: railDestinations!,
              extended: isDesktop,
              backgroundColor: AppColors.surface,
              labelType: isDesktop
                  ? NavigationRailLabelType.none
                  : NavigationRailLabelType.selected,
            ),
            const VerticalDivider(thickness: 1, width: 1),
            Expanded(child: body),
          ],
        ),
        floatingActionButton: floatingActionButton,
      );
    }

    // On mobile, show bottom navigation
    return AppScaffold(
      title: title,
      body: body,
      actions: actions,
      drawer: drawer,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
    );
  }
}

/// Page wrapper with consistent padding
class AppPage extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final bool safeArea;
  final bool scrollable;
  final ScrollController? scrollController;
  final RefreshCallback? onRefresh;

  const AppPage({
    super.key,
    required this.child,
    this.padding,
    this.safeArea = true,
    this.scrollable = true,
    this.scrollController,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    Widget content = Padding(
      padding: padding ?? AppSpacing.screenPadding,
      child: child,
    );

    if (scrollable) {
      content = SingleChildScrollView(
        controller: scrollController,
        child: content,
      );

      if (onRefresh != null) {
        content = RefreshIndicator(
          onRefresh: onRefresh!,
          child: content,
        );
      }
    }

    if (safeArea) {
      content = SafeArea(child: content);
    }

    return content;
  }
}

/// Empty state placeholder
class AppEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const AppEmptyState({
    super.key,
    this.icon = Icons.inbox_outlined,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: AppSpacing.screenPadding,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: AppColors.textTertiary,
            ),
            AppSpacing.verticalGapMd,
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            if (message != null) ...[
              AppSpacing.verticalGapSm,
              Text(
                message!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              AppSpacing.verticalGapLg,
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Error state placeholder
class AppErrorState extends StatelessWidget {
  final String title;
  final String? message;
  final String? retryLabel;
  final VoidCallback? onRetry;

  const AppErrorState({
    super.key,
    this.title = 'Something went wrong',
    this.message,
    this.retryLabel = 'Try Again',
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: AppSpacing.screenPadding,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.error,
            ),
            AppSpacing.verticalGapMd,
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            if (message != null) ...[
              AppSpacing.verticalGapSm,
              Text(
                message!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (onRetry != null) ...[
              AppSpacing.verticalGapLg,
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: Text(retryLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

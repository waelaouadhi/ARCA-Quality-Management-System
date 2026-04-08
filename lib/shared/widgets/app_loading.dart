import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_spacing.dart';

/// Loading indicator sizes
enum AppLoadingSize { small, medium, large }

/// QMS Design System Loading Indicator
class AppLoading extends StatelessWidget {
  final AppLoadingSize size;
  final Color? color;
  final double? strokeWidth;

  const AppLoading({
    super.key,
    this.size = AppLoadingSize.medium,
    this.color,
    this.strokeWidth,
  });

  factory AppLoading.small({Key? key, Color? color}) {
    return AppLoading(
      key: key,
      size: AppLoadingSize.small,
      color: color,
    );
  }

  factory AppLoading.medium({Key? key, Color? color}) {
    return AppLoading(
      key: key,
      size: AppLoadingSize.medium,
      color: color,
    );
  }

  factory AppLoading.large({Key? key, Color? color}) {
    return AppLoading(
      key: key,
      size: AppLoadingSize.large,
      color: color,
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _getSize(),
      height: _getSize(),
      child: CircularProgressIndicator(
        strokeWidth: strokeWidth ?? _getStrokeWidth(),
        valueColor: AlwaysStoppedAnimation<Color>(
          color ?? AppColors.primary,
        ),
      ),
    );
  }

  double _getSize() {
    switch (size) {
      case AppLoadingSize.small:
        return 20;
      case AppLoadingSize.medium:
        return 36;
      case AppLoadingSize.large:
        return 48;
    }
  }

  double _getStrokeWidth() {
    switch (size) {
      case AppLoadingSize.small:
        return 2;
      case AppLoadingSize.medium:
        return 3;
      case AppLoadingSize.large:
        return 4;
    }
  }
}

/// Full-screen loading overlay
class AppLoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;
  final Color? backgroundColor;
  final String? message;

  const AppLoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
    this.backgroundColor,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: backgroundColor ?? AppColors.overlay,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AppLoading.large(color: Colors.white),
                  if (message != null) ...[
                    AppSpacing.verticalGapMd,
                    Text(
                      message!,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}

/// Loading page placeholder
class AppLoadingPage extends StatelessWidget {
  final String? message;

  const AppLoadingPage({
    super.key,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AppLoading.large(),
            if (message != null) ...[
              AppSpacing.verticalGapMd,
              Text(
                message!,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Shimmer loading effect for content placeholders
class AppShimmer extends StatefulWidget {
  final Widget child;
  final bool enabled;

  const AppShimmer({
    super.key,
    required this.child,
    this.enabled = true,
  });

  @override
  State<AppShimmer> createState() => _AppShimmerState();
}

class _AppShimmerState extends State<AppShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
    if (widget.enabled) {
      _controller.repeat();
    }
  }

  @override
  void didUpdateWidget(AppShimmer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.enabled != oldWidget.enabled) {
      if (widget.enabled) {
        _controller.repeat();
      } else {
        _controller.stop();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return widget.child;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: const [
                Color(0xFFE0E0E0),
                Color(0xFFF5F5F5),
                Color(0xFFE0E0E0),
              ],
              stops: [
                (_animation.value - 1).clamp(0.0, 1.0),
                _animation.value.clamp(0.0, 1.0),
                (_animation.value + 1).clamp(0.0, 1.0),
              ],
            ).createShader(bounds);
          },
          child: widget.child,
        );
      },
      child: widget.child,
    );
  }
}

/// Shimmer placeholder shapes
class AppShimmerPlaceholder extends StatelessWidget {
  final double? width;
  final double height;
  final BorderRadius? borderRadius;

  const AppShimmerPlaceholder({
    super.key,
    this.width,
    required this.height,
    this.borderRadius,
  });

  factory AppShimmerPlaceholder.text({
    Key? key,
    double? width,
    double height = 16,
  }) {
    return AppShimmerPlaceholder(
      key: key,
      width: width,
      height: height,
      borderRadius: AppRadius.borderRadiusXs,
    );
  }

  factory AppShimmerPlaceholder.circle({
    Key? key,
    required double size,
  }) {
    return AppShimmerPlaceholder(
      key: key,
      width: size,
      height: size,
      borderRadius: BorderRadius.circular(size / 2),
    );
  }

  factory AppShimmerPlaceholder.card({
    Key? key,
    double? width,
    double height = 100,
  }) {
    return AppShimmerPlaceholder(
      key: key,
      width: width,
      height: height,
      borderRadius: AppRadius.cardRadius,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.disabledBackground,
        borderRadius: borderRadius ?? AppRadius.borderRadiusXs,
      ),
    );
  }
}

/// List shimmer loading placeholder
class AppListShimmer extends StatelessWidget {
  final int itemCount;
  final double itemHeight;
  final bool showLeadingCircle;

  const AppListShimmer({
    super.key,
    this.itemCount = 5,
    this.itemHeight = 72,
    this.showLeadingCircle = true,
  });

  @override
  Widget build(BuildContext context) {
    return AppShimmer(
      child: ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: itemCount,
        itemBuilder: (context, index) {
          return Container(
            height: itemHeight,
            padding: AppSpacing.listItemPadding,
            child: Row(
              children: [
                if (showLeadingCircle) ...[
                  AppShimmerPlaceholder.circle(size: 48),
                  AppSpacing.horizontalGapMd,
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AppShimmerPlaceholder.text(
                        width: 150,
                        height: 16,
                      ),
                      AppSpacing.verticalGapXs,
                      AppShimmerPlaceholder.text(
                        width: 100,
                        height: 12,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Grid shimmer loading placeholder
class AppGridShimmer extends StatelessWidget {
  final int itemCount;
  final int crossAxisCount;
  final double childAspectRatio;

  const AppGridShimmer({
    super.key,
    this.itemCount = 6,
    this.crossAxisCount = 2,
    this.childAspectRatio = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    return AppShimmer(
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          childAspectRatio: childAspectRatio,
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.md,
        ),
        itemCount: itemCount,
        itemBuilder: (context, index) {
          return AppShimmerPlaceholder.card();
        },
      ),
    );
  }
}

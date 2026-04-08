import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_shadows.dart';

/// Card variants for different use cases
enum AppCardVariant { elevated, outlined, filled }

/// QMS Design System Card Component
class AppCard extends StatelessWidget {
  final Widget child;
  final AppCardVariant variant;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final double? elevation;
  final bool showBorder;
  final Color? borderColor;

  const AppCard({
    super.key,
    required this.child,
    this.variant = AppCardVariant.elevated,
    this.padding,
    this.margin,
    this.onTap,
    this.onLongPress,
    this.backgroundColor,
    this.borderRadius,
    this.elevation,
    this.showBorder = false,
    this.borderColor,
  });

  /// Elevated card with shadow
  factory AppCard.elevated({
    Key? key,
    required Widget child,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    VoidCallback? onTap,
    VoidCallback? onLongPress,
    Color? backgroundColor,
    BorderRadius? borderRadius,
    double? elevation,
  }) {
    return AppCard(
      key: key,
      variant: AppCardVariant.elevated,
      padding: padding,
      margin: margin,
      onTap: onTap,
      onLongPress: onLongPress,
      backgroundColor: backgroundColor,
      borderRadius: borderRadius,
      elevation: elevation,
      child: child,
    );
  }

  /// Outlined card with border
  factory AppCard.outlined({
    Key? key,
    required Widget child,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    VoidCallback? onTap,
    VoidCallback? onLongPress,
    Color? backgroundColor,
    BorderRadius? borderRadius,
    Color? borderColor,
  }) {
    return AppCard(
      key: key,
      variant: AppCardVariant.outlined,
      padding: padding,
      margin: margin,
      onTap: onTap,
      onLongPress: onLongPress,
      backgroundColor: backgroundColor,
      borderRadius: borderRadius,
      showBorder: true,
      borderColor: borderColor,
      child: child,
    );
  }

  /// Filled card without shadow
  factory AppCard.filled({
    Key? key,
    required Widget child,
    EdgeInsetsGeometry? padding,
    EdgeInsetsGeometry? margin,
    VoidCallback? onTap,
    VoidCallback? onLongPress,
    Color? backgroundColor,
    BorderRadius? borderRadius,
  }) {
    return AppCard(
      key: key,
      variant: AppCardVariant.filled,
      padding: padding,
      margin: margin,
      onTap: onTap,
      onLongPress: onLongPress,
      backgroundColor: backgroundColor ?? AppColors.background,
      borderRadius: borderRadius,
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cardBorderRadius = borderRadius ?? AppRadius.cardRadius;
    final cardPadding = padding ?? AppSpacing.cardPadding;
    final cardMargin = margin ?? EdgeInsets.zero;

    Widget cardContent = Container(
      padding: cardPadding,
      decoration: _buildDecoration(cardBorderRadius),
      child: child,
    );

    if (onTap != null || onLongPress != null) {
      cardContent = Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          onLongPress: onLongPress,
          borderRadius: cardBorderRadius,
          child: cardContent,
        ),
      );
    }

    return Padding(
      padding: cardMargin,
      child: cardContent,
    );
  }

  BoxDecoration _buildDecoration(BorderRadius radius) {
    switch (variant) {
      case AppCardVariant.elevated:
        return BoxDecoration(
          color: backgroundColor ?? AppColors.card,
          borderRadius: radius,
          boxShadow: AppShadows.card,
        );
      case AppCardVariant.outlined:
        return BoxDecoration(
          color: backgroundColor ?? AppColors.card,
          borderRadius: radius,
          border: Border.all(
            color: borderColor ?? AppColors.border,
            width: 1,
          ),
        );
      case AppCardVariant.filled:
        return BoxDecoration(
          color: backgroundColor ?? AppColors.background,
          borderRadius: radius,
        );
    }
  }
}

/// Info card with icon, title, and optional description
class AppInfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? value;
  final Color? iconColor;
  final Color? iconBackgroundColor;
  final VoidCallback? onTap;
  final Widget? trailing;

  const AppInfoCard({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.value,
    this.iconColor,
    this.iconBackgroundColor,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: iconBackgroundColor ?? AppColors.primaryLight.withValues(alpha: 0.1),
              borderRadius: AppRadius.borderRadiusSm,
            ),
            child: Icon(
              icon,
              color: iconColor ?? AppColors.primary,
              size: 24,
            ),
          ),
          AppSpacing.horizontalGapMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.titleSmall,
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: AppTextStyles.bodySmall,
                  ),
              ],
            ),
          ),
          if (value != null)
            Text(
              value!,
              style: AppTextStyles.headlineSmall.copyWith(
                color: AppColors.primary,
              ),
            ),
          if (trailing != null) trailing!,
          if (onTap != null)
            const Icon(
              Icons.chevron_right,
              color: AppColors.textTertiary,
            ),
        ],
      ),
    );
  }
}

/// Stat card for displaying metrics
class AppStatCard extends StatelessWidget {
  final String title;
  final String value;
  final String? change;
  final bool? isPositiveChange;
  final IconData? icon;
  final Color? accentColor;
  final VoidCallback? onTap;

  const AppStatCard({
    super.key,
    required this.title,
    required this.value,
    this.change,
    this.isPositiveChange,
    this.icon,
    this.accentColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = accentColor ?? AppColors.primary;

    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: AppTextStyles.labelMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              if (icon != null)
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: AppRadius.borderRadiusSm,
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 18,
                  ),
                ),
            ],
          ),
          AppSpacing.verticalGapSm,
          Text(
            value,
            style: AppTextStyles.headlineMedium.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (change != null) ...[
            AppSpacing.verticalGapXs,
            Row(
              children: [
                Icon(
                  isPositiveChange == true
                      ? Icons.trending_up
                      : isPositiveChange == false
                          ? Icons.trending_down
                          : Icons.remove,
                  size: 16,
                  color: isPositiveChange == true
                      ? AppColors.success
                      : isPositiveChange == false
                          ? AppColors.error
                          : AppColors.textTertiary,
                ),
                AppSpacing.horizontalGapXxs,
                Text(
                  change!,
                  style: AppTextStyles.caption.copyWith(
                    color: isPositiveChange == true
                        ? AppColors.success
                        : isPositiveChange == false
                            ? AppColors.error
                            : AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// List item card
class AppListCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final bool showDivider;

  const AppListCard({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.onLongPress,
    this.showDivider = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AppCard(
          variant: AppCardVariant.filled,
          padding: AppSpacing.listItemPadding,
          onTap: onTap,
          onLongPress: onLongPress,
          backgroundColor: Colors.transparent,
          child: Row(
            children: [
              if (leading != null) ...[
                leading!,
                AppSpacing.horizontalGapMd,
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.bodyLarge,
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: AppTextStyles.bodySmall,
                      ),
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
        ),
        if (showDivider)
          const Divider(height: 1),
      ],
    );
  }
}

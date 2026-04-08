import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_spacing.dart';

/// Button size variants
enum AppButtonSize { small, medium, large }

/// Button style variants
enum AppButtonVariant { primary, secondary, outlined, text, danger }

/// Primary button component following QMS Design System
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final AppButtonSize size;
  final AppButtonVariant variant;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final bool isLoading;
  final bool isFullWidth;
  final bool isDisabled;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.size = AppButtonSize.medium,
    this.variant = AppButtonVariant.primary,
    this.prefixIcon,
    this.suffixIcon,
    this.isLoading = false,
    this.isFullWidth = false,
    this.isDisabled = false,
  });

  /// Primary filled button
  factory AppButton.primary({
    Key? key,
    required String text,
    VoidCallback? onPressed,
    AppButtonSize size = AppButtonSize.medium,
    IconData? prefixIcon,
    IconData? suffixIcon,
    bool isLoading = false,
    bool isFullWidth = false,
    bool isDisabled = false,
  }) {
    return AppButton(
      key: key,
      text: text,
      onPressed: onPressed,
      size: size,
      variant: AppButtonVariant.primary,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      isLoading: isLoading,
      isFullWidth: isFullWidth,
      isDisabled: isDisabled,
    );
  }

  /// Secondary filled button
  factory AppButton.secondary({
    Key? key,
    required String text,
    VoidCallback? onPressed,
    AppButtonSize size = AppButtonSize.medium,
    IconData? prefixIcon,
    IconData? suffixIcon,
    bool isLoading = false,
    bool isFullWidth = false,
    bool isDisabled = false,
  }) {
    return AppButton(
      key: key,
      text: text,
      onPressed: onPressed,
      size: size,
      variant: AppButtonVariant.secondary,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      isLoading: isLoading,
      isFullWidth: isFullWidth,
      isDisabled: isDisabled,
    );
  }

  /// Outlined button
  factory AppButton.outlined({
    Key? key,
    required String text,
    VoidCallback? onPressed,
    AppButtonSize size = AppButtonSize.medium,
    IconData? prefixIcon,
    IconData? suffixIcon,
    bool isLoading = false,
    bool isFullWidth = false,
    bool isDisabled = false,
  }) {
    return AppButton(
      key: key,
      text: text,
      onPressed: onPressed,
      size: size,
      variant: AppButtonVariant.outlined,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      isLoading: isLoading,
      isFullWidth: isFullWidth,
      isDisabled: isDisabled,
    );
  }

  /// Text button
  factory AppButton.text({
    Key? key,
    required String text,
    VoidCallback? onPressed,
    AppButtonSize size = AppButtonSize.medium,
    IconData? prefixIcon,
    IconData? suffixIcon,
    bool isLoading = false,
    bool isFullWidth = false,
    bool isDisabled = false,
  }) {
    return AppButton(
      key: key,
      text: text,
      onPressed: onPressed,
      size: size,
      variant: AppButtonVariant.text,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      isLoading: isLoading,
      isFullWidth: isFullWidth,
      isDisabled: isDisabled,
    );
  }

  /// Danger/destructive button
  factory AppButton.danger({
    Key? key,
    required String text,
    VoidCallback? onPressed,
    AppButtonSize size = AppButtonSize.medium,
    IconData? prefixIcon,
    IconData? suffixIcon,
    bool isLoading = false,
    bool isFullWidth = false,
    bool isDisabled = false,
  }) {
    return AppButton(
      key: key,
      text: text,
      onPressed: onPressed,
      size: size,
      variant: AppButtonVariant.danger,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      isLoading: isLoading,
      isFullWidth: isFullWidth,
      isDisabled: isDisabled,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEnabled = !isDisabled && !isLoading && onPressed != null;

    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: _getHeight(),
      child: _buildButton(isEnabled),
    );
  }

  Widget _buildButton(bool isEnabled) {
    switch (variant) {
      case AppButtonVariant.primary:
        return _buildPrimaryButton(isEnabled);
      case AppButtonVariant.secondary:
        return _buildSecondaryButton(isEnabled);
      case AppButtonVariant.outlined:
        return _buildOutlinedButton(isEnabled);
      case AppButtonVariant.text:
        return _buildTextButton(isEnabled);
      case AppButtonVariant.danger:
        return _buildDangerButton(isEnabled);
    }
  }

  Widget _buildPrimaryButton(bool isEnabled) {
    return ElevatedButton(
      onPressed: isEnabled ? onPressed : null,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
        disabledBackgroundColor: AppColors.disabledBackground,
        disabledForegroundColor: AppColors.disabled,
        padding: _getPadding(),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.buttonRadius,
        ),
      ),
      child: _buildContent(AppColors.textOnPrimary),
    );
  }

  Widget _buildSecondaryButton(bool isEnabled) {
    return ElevatedButton(
      onPressed: isEnabled ? onPressed : null,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.secondary,
        foregroundColor: AppColors.textOnSecondary,
        disabledBackgroundColor: AppColors.disabledBackground,
        disabledForegroundColor: AppColors.disabled,
        padding: _getPadding(),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.buttonRadius,
        ),
      ),
      child: _buildContent(AppColors.textOnSecondary),
    );
  }

  Widget _buildOutlinedButton(bool isEnabled) {
    return OutlinedButton(
      onPressed: isEnabled ? onPressed : null,
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        disabledForegroundColor: AppColors.disabled,
        padding: _getPadding(),
        side: BorderSide(
          color: isEnabled ? AppColors.primary : AppColors.disabled,
          width: 1.5,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.buttonRadius,
        ),
      ),
      child: _buildContent(isEnabled ? AppColors.primary : AppColors.disabled),
    );
  }

  Widget _buildTextButton(bool isEnabled) {
    return TextButton(
      onPressed: isEnabled ? onPressed : null,
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        disabledForegroundColor: AppColors.disabled,
        padding: _getPadding(),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.buttonRadius,
        ),
      ),
      child: _buildContent(isEnabled ? AppColors.primary : AppColors.disabled),
    );
  }

  Widget _buildDangerButton(bool isEnabled) {
    return ElevatedButton(
      onPressed: isEnabled ? onPressed : null,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.error,
        foregroundColor: AppColors.textOnPrimary,
        disabledBackgroundColor: AppColors.disabledBackground,
        disabledForegroundColor: AppColors.disabled,
        padding: _getPadding(),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.buttonRadius,
        ),
      ),
      child: _buildContent(AppColors.textOnPrimary),
    );
  }

  Widget _buildContent(Color color) {
    if (isLoading) {
      return SizedBox(
        width: _getIconSize(),
        height: _getIconSize(),
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (prefixIcon != null) ...[
          Icon(prefixIcon, size: _getIconSize()),
          SizedBox(width: AppSpacing.xs),
        ],
        Text(
          text,
          style: _getTextStyle(),
        ),
        if (suffixIcon != null) ...[
          SizedBox(width: AppSpacing.xs),
          Icon(suffixIcon, size: _getIconSize()),
        ],
      ],
    );
  }

  double _getHeight() {
    switch (size) {
      case AppButtonSize.small:
        return 36;
      case AppButtonSize.medium:
        return 44;
      case AppButtonSize.large:
        return 52;
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case AppButtonSize.small:
        return AppSpacing.buttonPaddingSmall;
      case AppButtonSize.medium:
        return AppSpacing.buttonPaddingMedium;
      case AppButtonSize.large:
        return AppSpacing.buttonPaddingLarge;
    }
  }

  TextStyle _getTextStyle() {
    switch (size) {
      case AppButtonSize.small:
        return AppTextStyles.buttonSmall;
      case AppButtonSize.medium:
        return AppTextStyles.buttonMedium;
      case AppButtonSize.large:
        return AppTextStyles.buttonLarge;
    }
  }

  double _getIconSize() {
    switch (size) {
      case AppButtonSize.small:
        return 16;
      case AppButtonSize.medium:
        return 20;
      case AppButtonSize.large:
        return 24;
    }
  }
}

/// Icon-only button
class AppIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final AppButtonSize size;
  final AppButtonVariant variant;
  final bool isLoading;
  final bool isDisabled;
  final String? tooltip;

  const AppIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.size = AppButtonSize.medium,
    this.variant = AppButtonVariant.primary,
    this.isLoading = false,
    this.isDisabled = false,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = !isDisabled && !isLoading && onPressed != null;
    final buttonSize = _getSize();
    final iconSize = _getIconSize();

    Widget button = SizedBox(
      width: buttonSize,
      height: buttonSize,
      child: _buildButton(isEnabled, iconSize),
    );

    if (tooltip != null) {
      button = Tooltip(
        message: tooltip!,
        child: button,
      );
    }

    return button;
  }

  Widget _buildButton(bool isEnabled, double iconSize) {
    final backgroundColor = _getBackgroundColor(isEnabled);
    final foregroundColor = _getForegroundColor(isEnabled);

    return Material(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(_getSize() / 2),
      child: InkWell(
        onTap: isEnabled ? onPressed : null,
        borderRadius: BorderRadius.circular(_getSize() / 2),
        child: Center(
          child: isLoading
              ? SizedBox(
                  width: iconSize,
                  height: iconSize,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
                  ),
                )
              : Icon(icon, size: iconSize, color: foregroundColor),
        ),
      ),
    );
  }

  double _getSize() {
    switch (size) {
      case AppButtonSize.small:
        return 32;
      case AppButtonSize.medium:
        return 40;
      case AppButtonSize.large:
        return 48;
    }
  }

  double _getIconSize() {
    switch (size) {
      case AppButtonSize.small:
        return 16;
      case AppButtonSize.medium:
        return 20;
      case AppButtonSize.large:
        return 24;
    }
  }

  Color _getBackgroundColor(bool isEnabled) {
    if (!isEnabled) return AppColors.disabledBackground;

    switch (variant) {
      case AppButtonVariant.primary:
        return AppColors.primary;
      case AppButtonVariant.secondary:
        return AppColors.secondary;
      case AppButtonVariant.outlined:
      case AppButtonVariant.text:
        return Colors.transparent;
      case AppButtonVariant.danger:
        return AppColors.error;
    }
  }

  Color _getForegroundColor(bool isEnabled) {
    if (!isEnabled) return AppColors.disabled;

    switch (variant) {
      case AppButtonVariant.primary:
      case AppButtonVariant.secondary:
      case AppButtonVariant.danger:
        return AppColors.textOnPrimary;
      case AppButtonVariant.outlined:
      case AppButtonVariant.text:
        return AppColors.primary;
    }
  }
}

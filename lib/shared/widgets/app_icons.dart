import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Centralized icon management system for QMS application
/// Maps business logic concepts to actual icon assets
class AppIcons {
  AppIcons._();

  // Base paths for different icon categories
  static const String _avatarsPath = 'assets/icons/Avatars/';
  static const String _decorativePath = 'assets/icons/Decorative_Icons/';
  static const String _informationalPath = 'assets/icons/Informational_icons/';
  static const String _formsPath = 'assets/icons/Informational_icons/form/';

  // ==========================================================================
  // USER MANAGEMENT ICONS
  // ==========================================================================

  /// User profile icon
  static const String user = '${_informationalPath}User.svg';
  
  /// Add user icon
  static const String addUser = '${_informationalPath}Add Round.svg';
  
  /// Edit user icon
  static const String editUser = '${_informationalPath}Edit.svg';
  
  /// Delete user icon
  static const String deleteUser = '${_informationalPath}Delete.svg';
  
  /// Users/team icon
  static const String users = '${_decorativePath}Icon-L-team.svg';

  // ==========================================================================
  // DOCUMENT MANAGEMENT ICONS
  // ==========================================================================

  /// Document/file icon
  static const String document = '${_informationalPath}Paperclip.svg';
  
  /// Add document icon
  static const String addDocument = '${_informationalPath}Add more.svg';
  
  /// Edit document icon
  static const String editDocument = '${_informationalPath}Edit-1.svg';
  
  /// Archive document icon
  static const String archiveDocument = '${_informationalPath}Bookmark.svg';
  
  /// Version/copy icon
  static const String documentVersion = '${_informationalPath}Copy.svg';

  // ==========================================================================
  // NON-CONFORMANCE ICONS
  // ==========================================================================

  /// Warning/danger icon for non-conformances
  static const String nonConformance = '${_informationalPath}Danger Triangle.svg';
  
  /// Add non-conformance icon
  static const String addNonConformance = '${_informationalPath}Add Round.svg';
  
  /// High severity icon
  static const String highSeverity = '${_informationalPath}Danger Circle.svg';
  
  /// Flag/report icon
  static const String reportIssue = '${_informationalPath}Flag.svg';
  
  /// Close/resolve icon
  static const String closeNonConformance = '${_informationalPath}Tick Round.svg';

  // ==========================================================================
  // CORRECTIVE ACTION ICONS
  // ==========================================================================

  /// Task/action icon
  static const String correctiveAction = '${_informationalPath}Settings.svg';
  
  /// Add action icon
  static const String addAction = '${_informationalPath}Add Round.svg';
  
  /// Complete action icon
  static const String completeAction = '${_informationalPath}Tick Round.svg';
  
  /// Assign task icon
  static const String assignTask = '${_informationalPath}User.svg';
  
  /// Calendar/due date icon
  static const String dueDate = '${_informationalPath}Calendar.svg';

  // ==========================================================================
  // GENERAL UI ICONS
  // ==========================================================================

  /// Navigation and actions
  static const String home = '${_informationalPath}Home.svg';
  static const String back = '${_informationalPath}arrow-left.svg';
  static const String forward = '${_informationalPath}arrow-right.svg';
  static const String up = '${_informationalPath}arrow-up.svg';
  static const String down = '${_informationalPath}arrow-down.svg';
  
  /// Chevrons for dropdowns and navigation
  static const String chevronUp = '${_informationalPath}icon-chevron-up.svg';
  static const String chevronDown = '${_informationalPath}icon-chevron-down.svg';
  static const String chevronLeft = '${_informationalPath}icon-chevron-left.svg';
  static const String chevronRight = '${_informationalPath}icon-chevron-right.svg';
  
  /// Common actions
  static const String add = '${_informationalPath}icon-add.svg';
  static const String edit = '${_informationalPath}Edit.svg';
  static const String delete = '${_informationalPath}Delete.svg';
  static const String close = '${_informationalPath}icon-close.svg';
  static const String menu = '${_informationalPath}icon-menu.svg';
  static const String search = '${_informationalPath}serarch.svg';
  static const String filter = '${_informationalPath}Filter 2.svg';
  static const String sort = '${_informationalPath}Sort.svg';
  static const String refresh = '${_informationalPath}refresh.svg';
  
  /// Status icons
  static const String success = '${_informationalPath}Tick Round.svg';
  static const String error = '${_informationalPath}Danger Circle.svg';
  static const String warning = '${_informationalPath}Danger Triangle.svg';
  static const String info = '${_informationalPath}Time Circle.svg';
  
  /// Authentication
  static const String login = '${_informationalPath}icon-login.svg';
  static const String logout = '${_informationalPath}icon-logout.svg';
  static const String lock = '${_informationalPath}Lock.svg';
  
  /// Forms
  static const String email = '${_informationalPath}Email.svg';
  static const String showPassword = '${_informationalPath}Show password.svg';
  static const String hidePassword = '${_informationalPath}Hide password.svg';

  // ==========================================================================
  // AVATAR ICONS (for user profiles)
  // ==========================================================================

  /// Default avatars for users
  static const List<String> avatars = [
    '${_avatarsPath}Steve.svg',
    '${_avatarsPath}Aliza.svg',
    '${_avatarsPath}Angie.svg',
    '${_avatarsPath}Arjun.svg',
    '${_avatarsPath}Blair.svg',
    '${_avatarsPath}Claudia.svg',
    '${_avatarsPath}Effie.svg',
    '${_avatarsPath}Fabian.svg',
    '${_avatarsPath}Helena.svg',
    '${_avatarsPath}Lara.svg',
    '${_avatarsPath}Milo.svg',
    '${_avatarsPath}Rahul.svg',
    '${_avatarsPath}Tanya.svg',
  ];

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /// Get a random avatar for a user
  static String getRandomAvatar([int? seed]) {
    final index = seed != null ? seed % avatars.length : 
                 DateTime.now().millisecond % avatars.length;
    return avatars[index];
  }

  /// Get avatar based on user ID hash
  static String getAvatarForUser(String userId) {
    final hash = userId.hashCode.abs();
    return avatars[hash % avatars.length];
  }

  /// Build an SVG icon widget
  static Widget svg(
    String assetPath, {
    double? width,
    double? height,
    Color? color,
    BoxFit fit = BoxFit.contain,
  }) {
    return SvgPicture.asset(
      assetPath,
      width: width,
      height: height,
      colorFilter: color != null ? ColorFilter.mode(color, BlendMode.srcIn) : null,
      fit: fit,
    );
  }

  /// Build an icon with standard sizing
  static Widget icon(
    String assetPath, {
    Color? color,
    double size = 24.0,
  }) {
    return svg(
      assetPath,
      width: size,
      height: size,
      color: color,
    );
  }

  /// Build a large icon
  static Widget largeIcon(
    String assetPath, {
    Color? color,
    double size = 32.0,
  }) {
    return svg(
      assetPath,
      width: size,
      height: size,
      color: color,
    );
  }

  /// Build a small icon
  static Widget smallIcon(
    String assetPath, {
    Color? color,
    double size = 16.0,
  }) {
    return svg(
      assetPath,
      width: size,
      height: size,
      color: color,
    );
  }

  /// Build an avatar widget
  static Widget avatar(
    String assetPath, {
    double size = 40.0,
  }) {
    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: svg(assetPath, fit: BoxFit.cover),
      ),
    );
  }
}

/// Icon size constants
class IconSizes {
  static const double xs = 12.0;
  static const double sm = 16.0;
  static const double md = 24.0;
  static const double lg = 32.0;
  static const double xl = 48.0;
  static const double xxl = 64.0;
}

/// Commonly used icon widgets with proper theming
class ThemedIcons {
  /// Get icon with theme-aware coloring
  static Widget icon(
    BuildContext context,
    String assetPath, {
    double size = IconSizes.md,
    Color? color,
  }) {
    final theme = Theme.of(context);
    final iconColor = color ?? theme.iconTheme.color ?? theme.colorScheme.onSurface;
    
    return AppIcons.icon(assetPath, color: iconColor, size: size);
  }

  /// Primary colored icon
  static Widget primary(
    BuildContext context,
    String assetPath, {
    double size = IconSizes.md,
  }) {
    return AppIcons.icon(
      assetPath,
      color: Theme.of(context).colorScheme.primary,
      size: size,
    );
  }

  /// Secondary colored icon
  static Widget secondary(
    BuildContext context,
    String assetPath, {
    double size = IconSizes.md,
  }) {
    return AppIcons.icon(
      assetPath,
      color: Theme.of(context).colorScheme.secondary,
      size: size,
    );
  }

  /// Error colored icon
  static Widget error(
    BuildContext context,
    String assetPath, {
    double size = IconSizes.md,
  }) {
    return AppIcons.icon(
      assetPath,
      color: Theme.of(context).colorScheme.error,
      size: size,
    );
  }

  /// Success colored icon (usually green)
  static Widget success(
    BuildContext context,
    String assetPath, {
    double size = IconSizes.md,
  }) {
    return AppIcons.icon(
      assetPath,
      color: Colors.green,
      size: size,
    );
  }

  /// Warning colored icon (usually amber)
  static Widget warning(
    BuildContext context,
    String assetPath, {
    double size = IconSizes.md,
  }) {
    return AppIcons.icon(
      assetPath,
      color: Colors.amber,
      size: size,
    );
  }
}
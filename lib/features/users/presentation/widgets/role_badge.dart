import 'package:flutter/material.dart';

import '../../../auth/domain/entities/user.dart';

/// Badge widget to display user role
class RoleBadge extends StatelessWidget {
  final UserRole role;
  final bool compact;

  const RoleBadge({
    super.key,
    required this.role,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    // Determine badge color based on role
    final (backgroundColor, foregroundColor) = _getRoleColors(colorScheme);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 8,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(compact ? 8 : 12),
      ),
      child: Text(
        compact ? _getCompactText() : role.displayName,
        style: TextStyle(
          color: foregroundColor,
          fontSize: compact ? 10 : 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  /// Get colors for each role
  (Color, Color) _getRoleColors(ColorScheme colorScheme) {
    switch (role) {
      case UserRole.admin:
        return (
          colorScheme.errorContainer,
          colorScheme.onErrorContainer,
        );
      case UserRole.manager:
        return (
          colorScheme.primaryContainer,
          colorScheme.onPrimaryContainer,
        );
      case UserRole.user:
        return (
          colorScheme.secondaryContainer,
          colorScheme.onSecondaryContainer,
        );
    }
  }

  /// Get compact text (first letter) for role
  String _getCompactText() {
    switch (role) {
      case UserRole.admin:
        return 'A';
      case UserRole.manager:
        return 'M';
      case UserRole.user:
        return 'U';
    }
  }
}

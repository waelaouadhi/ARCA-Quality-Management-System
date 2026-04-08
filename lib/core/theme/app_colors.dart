import 'package:flutter/material.dart';

/// QMS Design System Colors
/// Based on QM Design System UI Kit - Professional Quality Management palette
class AppColors {
  AppColors._();

  // ============ Primary Colors ============
  static const Color primary = Color(0xFF1E3A5F);       // Deep Navy Blue
  static const Color primaryLight = Color(0xFF2E5A8F);  // Lighter Navy
  static const Color primaryDark = Color(0xFF0F1F33);   // Darker Navy
  
  // ============ Secondary Colors ============
  static const Color secondary = Color(0xFF4A90D9);     // Bright Blue
  static const Color secondaryLight = Color(0xFF7AB3E8);
  static const Color secondaryDark = Color(0xFF2D6CB0);

  // ============ Accent Colors ============
  static const Color accent = Color(0xFF00BFA5);        // Teal accent
  static const Color accentLight = Color(0xFF5DF2D6);
  static const Color accentDark = Color(0xFF008E76);

  // ============ Background Colors ============
  static const Color background = Color(0xFFF5F7FA);    // Light gray background
  static const Color backgroundDark = Color(0xFF121212);
  static const Color backgroundSecondary = Color(0xFFEEF2F6); // Slightly darker background
  static const Color surface = Color(0xFFFFFFFF);       // White surface
  static const Color surfaceDark = Color(0xFF1E1E1E);
  static const Color card = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF2D2D2D);

  // ============ Text Colors ============
  static const Color textPrimary = Color(0xFF1A1A2E);   // Almost black
  static const Color textSecondary = Color(0xFF6B7280); // Gray
  static const Color textTertiary = Color(0xFF9CA3AF);  // Light gray
  static const Color textOnPrimary = Color(0xFFFFFFFF); // White text on primary
  static const Color textOnSecondary = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFFE5E5E5);      // Light text for dark mode

  // ============ Status Colors ============
  static const Color success = Color(0xFF10B981);       // Green
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color successDark = Color(0xFF059669);
  
  static const Color warning = Color(0xFFF59E0B);       // Amber
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color warningDark = Color(0xFFD97706);
  
  static const Color error = Color(0xFFEF4444);         // Red
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color errorDark = Color(0xFFDC2626);
  
  static const Color info = Color(0xFF3B82F6);          // Blue
  static const Color infoLight = Color(0xFFDBEAFE);
  static const Color infoDark = Color(0xFF2563EB);

  // ============ Border Colors ============
  static const Color border = Color(0xFFE5E7EB);        // Light border
  static const Color borderDark = Color(0xFF374151);    // Dark border
  static const Color divider = Color(0xFFE5E7EB);
  static const Color dividerDark = Color(0xFF374151);

  // ============ Input Colors ============
  static const Color inputBackground = Color(0xFFF9FAFB);
  static const Color inputBorder = Color(0xFFD1D5DB);
  static const Color inputBorderFocus = Color(0xFF4A90D9);
  static const Color inputBorderError = Color(0xFFEF4444);

  // ============ Disabled Colors ============
  static const Color disabled = Color(0xFF9CA3AF);
  static const Color disabledBackground = Color(0xFFF3F4F6);

  // ============ Shadow Colors ============
  static const Color shadow = Color(0x1A000000);        // 10% black
  static const Color shadowDark = Color(0x40000000);    // 25% black

  // ============ Overlay Colors ============
  static const Color overlay = Color(0x80000000);       // 50% black
  static const Color overlayLight = Color(0x40000000);  // 25% black

  // ============ Gradient Colors ============
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryLight],
  );

  static const LinearGradient secondaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [secondary, secondaryLight],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accent, accentLight],
  );
}

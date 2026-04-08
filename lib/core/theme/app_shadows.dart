import 'package:flutter/material.dart';
import 'app_colors.dart';

/// QMS Design System Shadows/Elevation
/// Consistent shadow system for depth and hierarchy
class AppShadows {
  AppShadows._();

  // ============ Shadow Levels ============
  
  /// Level 0 - No shadow (flat)
  static const List<BoxShadow> none = [];

  /// Level 1 - Subtle shadow for cards and surfaces
  static const List<BoxShadow> sm = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 4,
      offset: Offset(0, 1),
      spreadRadius: 0,
    ),
  ];

  /// Level 2 - Medium shadow for elevated cards
  static const List<BoxShadow> md = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 8,
      offset: Offset(0, 2),
      spreadRadius: 0,
    ),
    BoxShadow(
      color: Color(0x0A000000),
      blurRadius: 4,
      offset: Offset(0, 1),
      spreadRadius: 0,
    ),
  ];

  /// Level 3 - Large shadow for dropdowns and popovers
  static const List<BoxShadow> lg = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 16,
      offset: Offset(0, 4),
      spreadRadius: -2,
    ),
    BoxShadow(
      color: Color(0x0D000000),
      blurRadius: 8,
      offset: Offset(0, 2),
      spreadRadius: 0,
    ),
  ];

  /// Level 4 - Extra large shadow for modals and dialogs
  static const List<BoxShadow> xl = [
    BoxShadow(
      color: AppColors.shadowDark,
      blurRadius: 24,
      offset: Offset(0, 8),
      spreadRadius: -4,
    ),
    BoxShadow(
      color: Color(0x14000000),
      blurRadius: 12,
      offset: Offset(0, 4),
      spreadRadius: 0,
    ),
  ];

  /// Level 5 - Maximum shadow for floating elements
  static const List<BoxShadow> xxl = [
    BoxShadow(
      color: AppColors.shadowDark,
      blurRadius: 32,
      offset: Offset(0, 12),
      spreadRadius: -6,
    ),
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 16,
      offset: Offset(0, 6),
      spreadRadius: 0,
    ),
  ];

  // ============ Semantic Shadows ============
  
  /// Card shadow - subtle elevation
  static const List<BoxShadow> card = sm;
  
  /// Card shadow when hovered
  static const List<BoxShadow> cardHover = md;
  
  /// Dropdown/Menu shadow
  static const List<BoxShadow> dropdown = lg;
  
  /// Dialog/Modal shadow
  static const List<BoxShadow> dialog = xl;
  
  /// Bottom sheet shadow
  static const List<BoxShadow> bottomSheet = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 16,
      offset: Offset(0, -4),
      spreadRadius: 0,
    ),
  ];

  /// Button shadow (primary buttons)
  static const List<BoxShadow> button = [
    BoxShadow(
      color: Color(0x26000000),
      blurRadius: 4,
      offset: Offset(0, 2),
      spreadRadius: 0,
    ),
  ];

  /// Input focus shadow
  static List<BoxShadow> inputFocus = [
    BoxShadow(
      color: AppColors.secondary.withValues(alpha: 0.25),
      blurRadius: 4,
      offset: const Offset(0, 0),
      spreadRadius: 0,
    ),
  ];

  /// Error input shadow
  static List<BoxShadow> inputError = [
    BoxShadow(
      color: AppColors.error.withValues(alpha: 0.25),
      blurRadius: 4,
      offset: const Offset(0, 0),
      spreadRadius: 0,
    ),
  ];
}

/// Elevation values for Material widgets
class AppElevation {
  AppElevation._();

  static const double none = 0;
  static const double xs = 1;
  static const double sm = 2;
  static const double md = 4;
  static const double lg = 8;
  static const double xl = 12;
  static const double xxl = 16;

  // Semantic elevations
  static const double card = xs;
  static const double cardHover = sm;
  static const double appBar = md;
  static const double dropdown = lg;
  static const double dialog = xl;
  static const double fab = lg;
}

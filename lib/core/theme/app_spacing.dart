import 'package:flutter/material.dart';

/// QMS Design System Spacing
/// Based on 4px base unit scale: 4/8/12/16/24/32/48/64
class AppSpacing {
  AppSpacing._();

  // ============ Base Spacing Units ============
  static const double xxs = 4.0;   // Extra extra small
  static const double xs = 8.0;    // Extra small
  static const double sm = 12.0;   // Small
  static const double md = 16.0;   // Medium (default)
  static const double lg = 24.0;   // Large
  static const double xl = 32.0;   // Extra large
  static const double xxl = 48.0;  // Extra extra large
  static const double xxxl = 64.0; // Triple extra large

  // ============ Screen Padding ============
  static const double screenPaddingHorizontal = 16.0;
  static const double screenPaddingVertical = 24.0;
  
  static const EdgeInsets screenPadding = EdgeInsets.symmetric(
    horizontal: screenPaddingHorizontal,
    vertical: screenPaddingVertical,
  );

  static const EdgeInsets screenPaddingHorizontalOnly = EdgeInsets.symmetric(
    horizontal: screenPaddingHorizontal,
  );

  // ============ Card Padding ============
  static const EdgeInsets cardPadding = EdgeInsets.all(md);
  static const EdgeInsets cardPaddingSmall = EdgeInsets.all(sm);
  static const EdgeInsets cardPaddingLarge = EdgeInsets.all(lg);

  // ============ Button Padding ============
  static const EdgeInsets buttonPaddingLarge = EdgeInsets.symmetric(
    horizontal: lg,
    vertical: md,
  );
  
  static const EdgeInsets buttonPaddingMedium = EdgeInsets.symmetric(
    horizontal: md,
    vertical: sm,
  );
  
  static const EdgeInsets buttonPaddingSmall = EdgeInsets.symmetric(
    horizontal: sm,
    vertical: xs,
  );

  // ============ Input Padding ============
  static const EdgeInsets inputPadding = EdgeInsets.symmetric(
    horizontal: md,
    vertical: sm,
  );

  static const EdgeInsets inputContentPadding = EdgeInsets.symmetric(
    horizontal: md,
    vertical: md,
  );

  // ============ List Item Padding ============
  static const EdgeInsets listItemPadding = EdgeInsets.symmetric(
    horizontal: md,
    vertical: sm,
  );

  // ============ Section Spacing ============
  static const double sectionSpacing = xl;
  static const double itemSpacing = md;
  static const double smallItemSpacing = xs;

  // ============ Gap Widgets ============
  static const SizedBox verticalGapXxs = SizedBox(height: xxs);
  static const SizedBox verticalGapXs = SizedBox(height: xs);
  static const SizedBox verticalGapSm = SizedBox(height: sm);
  static const SizedBox verticalGapMd = SizedBox(height: md);
  static const SizedBox verticalGapLg = SizedBox(height: lg);
  static const SizedBox verticalGapXl = SizedBox(height: xl);
  static const SizedBox verticalGapXxl = SizedBox(height: xxl);

  static const SizedBox horizontalGapXxs = SizedBox(width: xxs);
  static const SizedBox horizontalGapXs = SizedBox(width: xs);
  static const SizedBox horizontalGapSm = SizedBox(width: sm);
  static const SizedBox horizontalGapMd = SizedBox(width: md);
  static const SizedBox horizontalGapLg = SizedBox(width: lg);
  static const SizedBox horizontalGapXl = SizedBox(width: xl);
  static const SizedBox horizontalGapXxl = SizedBox(width: xxl);
}

/// Border Radius constants based on design system
class AppRadius {
  AppRadius._();

  static const double none = 0.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double full = 999.0; // For pill-shaped buttons

  // Pre-built BorderRadius objects
  static const BorderRadius borderRadiusNone = BorderRadius.zero;
  static const BorderRadius borderRadiusXs = BorderRadius.all(Radius.circular(xs));
  static const BorderRadius borderRadiusSm = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius borderRadiusMd = BorderRadius.all(Radius.circular(md));
  static const BorderRadius borderRadiusLg = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius borderRadiusXl = BorderRadius.all(Radius.circular(xl));
  static const BorderRadius borderRadiusFull = BorderRadius.all(Radius.circular(full));

  // Card radius
  static const BorderRadius cardRadius = borderRadiusMd;
  
  // Button radius
  static const BorderRadius buttonRadius = borderRadiusSm;
  
  // Input radius
  static const BorderRadius inputRadius = borderRadiusSm;

  // Dialog radius
  static const BorderRadius dialogRadius = borderRadiusLg;

  // Bottom sheet radius
  static const BorderRadius bottomSheetRadius = BorderRadius.only(
    topLeft: Radius.circular(lg),
    topRight: Radius.circular(lg),
  );
}

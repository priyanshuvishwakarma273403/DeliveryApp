import 'package:flutter/material.dart';

class AppColors {
  // Signature Brand Palette (Zomato / Tomato Red & Accent Orange)
  static const Color primary = Color(0xFFE23744);
  static const Color primaryDark = Color(0xFFC12E3A);
  static const Color primaryLight = Color(0xFFEE5B68);

  static const Color secondary = Color(0xFFFC8019); // Swiggy Orange
  static const Color secondaryDark = Color(0xFFE67316);
  static const Color secondaryLight = Color(0xFFFD9947);

  // Backgrounds & Surfaces (Light)
  static const Color backgroundLight = Color(0xFFF8F9FA);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color borderLight = Color(0xFFEBEBF0);

  // Backgrounds & Surfaces (Dark)
  static const Color backgroundDark = Color(0xFF0F1015);
  static const Color surfaceDark = Color(0xFF16171E);
  static const Color cardDark = Color(0xFF1B1C24);
  static const Color borderDark = Color(0xFF262833);

  // Typography Tokens
  static const Color textPrimaryLight = Color(0xFF1C1C1C);
  static const Color textSecondaryLight = Color(0xFF686B78);
  static const Color textMutedLight = Color(0xFF9E9EA7);

  static const Color textPrimaryDark = Color(0xFFF5F5F7);
  static const Color textSecondaryDark = Color(0xFFA1A1AA);
  static const Color textMutedDark = Color(0xFF71717A);

  // Semantic & Status
  static const Color success = Color(0xFF26A541); // Pure Veg & Confirmed
  static const Color warning = Color(0xFFFC8019);
  static const Color error = Color(0xFFE23744);   // Non-Veg & Error
  static const Color info = Color(0xFF2563EB);

  // Gamification & Gold
  static const Color gold = Color(0xFFFFB800);
  static const Color goldDark = Color(0xFFD49700);

  // Glassmorphic Overlay Tints
  static Color glassLight = Colors.white.withOpacity(0.85);
  static Color glassDark = const Color(0xFF16171E).withOpacity(0.85);
}

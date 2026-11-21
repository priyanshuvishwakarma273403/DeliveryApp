import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';

class AppTypography {
  // Headings use Outfit for premium bold typography matching FoodIQ web
  static TextStyle headlineLarge({bool isDark = false}) => GoogleFonts.outfit(
        fontSize: 32,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.8,
        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
      );

  static TextStyle headlineMedium({bool isDark = false}) => GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
      );

  static TextStyle headlineSmall({bool isDark = false}) => GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
      );

  static TextStyle titleLarge({bool isDark = false}) => GoogleFonts.outfit(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
      );

  static TextStyle titleMedium({bool isDark = false}) => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
      );

  // Body text uses Inter for crisp mobile readability
  static TextStyle bodyLarge({bool isDark = false}) => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
      );

  static TextStyle bodyMedium({bool isDark = false}) => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
      );

  static TextStyle bodySmall({bool isDark = false}) => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
      );

  static TextStyle labelLarge({bool isDark = false, Color? color}) => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
        color: color ?? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
      );

  static TextStyle labelSmall({bool isDark = false}) => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
      );
}

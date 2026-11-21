import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';

class FoodIQLogo extends StatelessWidget {
  final double size;
  final bool showTagline;

  const FoodIQLogo({
    super.key,
    this.size = 36.0,
    this.showTagline = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.restaurant_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 10),
            RichText(
              text: TextSpan(
                style: GoogleFonts.outfit(
                  fontSize: size,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1.0,
                  color: AppColors.textPrimaryLight,
                ),
                children: [
                  const TextSpan(text: 'Food'),
                  TextSpan(
                    text: 'IQ',
                    style: TextStyle(
                      color: AppColors.primary,
                      shadows: [
                        Shadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (showTagline) ...[
          const SizedBox(height: 6),
          Text(
            'INTELLIGENT FOOD DELIVERY',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 2.0,
              color: AppColors.textSecondaryLight,
            ),
          ),
        ],
      ],
    );
  }
}

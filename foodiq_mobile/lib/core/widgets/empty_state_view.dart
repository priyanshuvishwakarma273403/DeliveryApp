import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';

class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String? buttonText;
  final VoidCallback? onButtonPressed;

  EmptyStateView({
    super.key,
    required this.icon,
    required this.title,
    String? description,
    String? message,
    String? buttonText,
    String? actionLabel,
    VoidCallback? onButtonPressed,
    VoidCallback? onAction,
  })  : description = description ?? message ?? '',
        buttonText = buttonText ?? actionLabel,
        onButtonPressed = onButtonPressed ?? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 56,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: AppTypography.headlineSmall(),
            ),
            const SizedBox(height: 10),
            Text(
              description,
              textAlign: TextAlign.center,
              style: AppTypography.bodyMedium(),
            ),
            if (buttonText != null && onButtonPressed != null) ...[
              const SizedBox(height: 28),
              AppButton(
                text: buttonText!,
                onPressed: onButtonPressed,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

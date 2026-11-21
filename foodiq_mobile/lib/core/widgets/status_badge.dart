import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool isVeg;

  const StatusBadge({
    super.key,
    required this.status,
    this.isVeg = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label = status;

    switch (status.toUpperCase()) {
      case 'PLACED':
        bg = Colors.blue.withOpacity(0.12);
        fg = Colors.blue;
        label = 'Order Placed';
        break;
      case 'CONFIRMED':
        bg = AppColors.success.withOpacity(0.12);
        fg = AppColors.success;
        label = 'Confirmed';
        break;
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
        bg = AppColors.secondary.withOpacity(0.12);
        fg = AppColors.secondary;
        label = 'Kitchen Prep';
        break;
      case 'OUT_FOR_DELIVERY':
        bg = AppColors.primary.withOpacity(0.12);
        fg = AppColors.primary;
        label = 'On the Way';
        break;
      case 'DELIVERED':
        bg = AppColors.success.withOpacity(0.12);
        fg = AppColors.success;
        label = 'Delivered';
        break;
      case 'CANCELLED':
        bg = AppColors.error.withOpacity(0.12);
        fg = AppColors.error;
        label = 'Cancelled';
        break;
      default:
        bg = Colors.grey.withOpacity(0.12);
        fg = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

class VegBadge extends StatelessWidget {
  final bool isVeg;
  final double size;

  const VegBadge({super.key, required this.isVeg, this.size = 16.0});

  @override
  Widget build(BuildContext context) {
    final color = isVeg ? AppColors.success : AppColors.error;

    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(2.5),
      decoration: BoxDecoration(
        border: Border.all(color: color, width: 1.5),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(
        child: Container(
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }
}

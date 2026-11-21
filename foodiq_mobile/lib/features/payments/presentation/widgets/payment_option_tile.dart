import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_method_enum.dart';

class PaymentOptionTile extends StatelessWidget {
  final PaymentMethod method;
  final bool isSelected;
  final VoidCallback onSelect;

  const PaymentOptionTile({
    super.key,
    required this.method,
    required this.isSelected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.cardBackground(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppColors.primaryRed : Colors.grey.withOpacity(0.2),
          width: isSelected ? 1.5 : 1,
        ),
      ),
      child: ListTile(
        onTap: onSelect,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primaryRed.withOpacity(0.1)
                : Colors.grey.withOpacity(0.08),
            shape: BoxShape.circle,
          ),
          child: Icon(
            method.icon,
            color: isSelected ? AppColors.primaryRed : AppColors.neutralGray,
            size: 20,
          ),
        ),
        title: Text(
          method.displayName,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          ),
        ),
        subtitle: Text(
          method.subtitle,
          style: const TextStyle(fontSize: 11, color: AppColors.neutralGray),
        ),
        trailing: Radio<PaymentMethod>(
          value: method,
          groupValue: isSelected ? method : null,
          activeColor: AppColors.primaryRed,
          onChanged: (_) => onSelect(),
        ),
      ),
    );
  }
}

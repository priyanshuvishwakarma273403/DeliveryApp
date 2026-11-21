import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/features/cart/domain/models/smart_combo_model.dart';

class ComboRecommendationCard extends StatelessWidget {
  final SmartComboModel combo;
  final VoidCallback onAddCombo;

  const ComboRecommendationCard({
    super.key,
    required this.combo,
    required this.onAddCombo,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.cardBackground(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accentOrange.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.accentOrange,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${combo.discountPercentage}% OFF',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              const Icon(Icons.auto_awesome, color: AppColors.accentOrange, size: 16),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            combo.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          const SizedBox(height: 4),
          Text(
            combo.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 11, color: AppColors.neutralGray),
          ),
          const Spacer(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    CurrencyFormatter.formatINR(combo.comboPrice),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  if (combo.savings > 0)
                    Text(
                      CurrencyFormatter.formatINR(combo.originalPrice),
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.neutralGray,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                ],
              ),
              ElevatedButton(
                onPressed: onAddCombo,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: const Text('Add Combo', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

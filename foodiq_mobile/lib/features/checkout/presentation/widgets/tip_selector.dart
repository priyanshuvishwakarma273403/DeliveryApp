import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';

class TipSelector extends StatelessWidget {
  final double selectedTip;
  final ValueChanged<double> onTipSelected;

  const TipSelector({
    super.key,
    required this.selectedTip,
    required this.onTipSelected,
  });

  @override
  Widget build(BuildContext context) {
    const tipOptions = [0.0, 20.0, 30.0, 50.0];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBackground(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.volunteer_activism_outlined, size: 18, color: AppColors.accentOrange),
              SizedBox(width: 8),
              Text(
                'Tip your delivery partner',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            '100% of the tip goes directly to your delivery partner',
            style: TextStyle(fontSize: 11, color: AppColors.neutralGray),
          ),
          const SizedBox(height: 10),
          Row(
            children: tipOptions.map((tip) {
              final isSelected = selectedTip == tip;
              final label = tip == 0.0 ? 'No Tip' : CurrencyFormatter.formatINR(tip);

              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: OutlinedButton(
                    onPressed: () => onTipSelected(tip),
                    style: OutlinedButton.styleFrom(
                      backgroundColor: isSelected
                          ? AppColors.primaryRed.withOpacity(0.1)
                          : Colors.transparent,
                      side: BorderSide(
                        color: isSelected ? AppColors.primaryRed : Colors.grey.withOpacity(0.3),
                        width: isSelected ? 1.5 : 1,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? AppColors.primaryRed : null,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

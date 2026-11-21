import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/shared/models/cart_item_model.dart';

class AllergyGuardianBanner extends StatelessWidget {
  final List<CartItemModel> items;

  const AllergyGuardianBanner({
    super.key,
    required this.items,
  });

  List<String> _detectPotentialAllergens() {
    final allergens = <String>{};
    for (final item in items) {
      final nameLower = item.name.toLowerCase();
      if (nameLower.contains('paneer') ||
          nameLower.contains('cheese') ||
          nameLower.contains('butter') ||
          nameLower.contains('cream') ||
          nameLower.contains('malai') ||
          nameLower.contains('dahi') ||
          nameLower.contains('curd')) {
        allergens.add('Dairy');
      }
      if (nameLower.contains('nut') ||
          nameLower.contains('peanut') ||
          nameLower.contains('kaju') ||
          nameLower.contains('cashew') ||
          nameLower.contains('badam') ||
          nameLower.contains('almond')) {
        allergens.add('Nuts');
      }
      if (nameLower.contains('wheat') ||
          nameLower.contains('roti') ||
          nameLower.contains('naan') ||
          nameLower.contains('paratha') ||
          nameLower.contains('pasta') ||
          nameLower.contains('pizza')) {
        allergens.add('Gluten');
      }
      if (nameLower.contains('egg') || nameLower.contains('anda')) {
        allergens.add('Egg');
      }
      if (nameLower.contains('prawn') ||
          nameLower.contains('crab') ||
          nameLower.contains('fish')) {
        allergens.add('Seafood');
      }
    }
    return allergens.toList();
  }

  @override
  Widget build(BuildContext context) {
    final detected = _detectPotentialAllergens();
    if (detected.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.accentOrange.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.accentOrange.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.shield_outlined, color: AppColors.accentOrange, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'FoodIQ Allergy Guardian',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: AppColors.accentOrange,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Your cart contains ingredients associated with: ${detected.join(', ')}. Please verify before confirming if you have dietary sensitivities.',
                  style: const TextStyle(fontSize: 12, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

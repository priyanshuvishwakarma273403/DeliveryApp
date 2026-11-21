import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/core/widgets/status_badge.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';

class FoodDetailBottomSheet extends StatelessWidget {
  final MenuItemModel item;
  final VoidCallback onAddToCart;

  const FoodDetailBottomSheet({
    super.key,
    required this.item,
    required this.onAddToCart,
  });

  static void show(BuildContext context, MenuItemModel item, VoidCallback onAddToCart) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FoodDetailBottomSheet(
        item: item,
        onAddToCart: onAddToCart,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover Image
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            child: CachedNetworkImage(
              imageUrl: item.imageUrl ??
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
              height: 220,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    VegBadge(isVeg: item.isVeg, size: 20),
                    Text(
                      CurrencyFormatter.format(item.price),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(item.name, style: AppTypography.headlineSmall()),
                const SizedBox(height: 8),
                Text(item.description, style: AppTypography.bodyMedium()),
                const SizedBox(height: 20),

                // Allergen & Dietary Information (Allergy Guardian)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundLight,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shield_outlined, size: 20, color: AppColors.secondary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          item.isVeg
                              ? '100% Vegetarian verified • Prepared in hygienic conditions.'
                              : 'Contains meat/poultry • Verified fresh kitchen sourcing.',
                          style: AppTypography.bodySmall(),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                AppButton(
                  text: 'Add to Cart (${CurrencyFormatter.format(item.price)})',
                  width: double.infinity,
                  onPressed: () {
                    onAddToCart();
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

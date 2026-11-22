import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/status_badge.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';

class FoodItemCard extends StatelessWidget {
  final MenuItemModel item;
  final int quantityInCart;
  final VoidCallback onAdd;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final VoidCallback? onTap;

  const FoodItemCard({
    super.key,
    required this.item,
    int? quantity,
    int? quantityInCart,
    required this.onAdd,
    required this.onIncrement,
    required this.onDecrement,
    this.onTap,
  }) : quantityInCart = quantity ?? quantityInCart ?? 0;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  VegBadge(isVeg: item.isVeg),
                  const SizedBox(height: 6),
                  Text(
                    item.name,
                    style: AppTypography.titleMedium(),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    CurrencyFormatter.format(item.price),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodySmall(),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            // Thumbnail with Stepper
            Column(
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.bottomCenter,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: CachedNetworkImage(
                        imageUrl: item.imageUrl ??
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
                        width: 110,
                        height: 100,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          width: 110,
                          height: 100,
                          color: AppColors.backgroundLight,
                          child: const Icon(Icons.fastfood_rounded, color: AppColors.textMutedLight),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -14,
                      child: item.available
                          ? _buildAddButton()
                          : Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade800,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'OUT OF STOCK',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddButton() {
    if (quantityInCart > 0) {
      return Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.35),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: onDecrement,
              child: const Icon(Icons.remove, size: 18, color: Colors.white),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                '$quantityInCart',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
            GestureDetector(
              onTap: onIncrement,
              child: const Icon(Icons.add, size: 18, color: Colors.white),
            ),
          ],
        ),
      );
    }

    return Container(
      height: 36,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.primary, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextButton(
        onPressed: onAdd,
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          minimumSize: Size.zero,
        ),
        child: const Text(
          'ADD',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w900,
            fontSize: 13,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/shared/models/cart_item_model.dart';

class CartItemRow extends StatelessWidget {
  final CartItemModel item;
  final ValueChanged<int> onQuantityChanged;

  const CartItemRow({
    super.key,
    required this.item,
    required this.onQuantityChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Veg / Non-veg symbol
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              border: Border.all(
                color: item.isVeg ? AppColors.vegGreen : AppColors.nonVegRed,
                width: 1.5,
              ),
              borderRadius: BorderRadius.circular(3),
            ),
            alignment: Alignment.center,
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: item.isVeg ? AppColors.vegGreen : AppColors.nonVegRed,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Item Name & Unit Price
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  CurrencyFormatter.formatINR(item.price),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.neutralGray,
                  ),
                ),
              ],
            ),
          ),

          // Stepper Counter (- Qty +)
          Container(
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.primaryRed.withOpacity(0.08),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: AppColors.primaryRed.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                InkWell(
                  onTap: () => onQuantityChanged(item.quantity - 1),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Icon(Icons.remove, size: 16, color: AppColors.primaryRed),
                  ),
                ),
                Text(
                  '${item.quantity}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryRed,
                  ),
                ),
                InkWell(
                  onTap: () => onQuantityChanged(item.quantity + 1),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Icon(Icons.add, size: 16, color: AppColors.primaryRed),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Subtotal
          SizedBox(
            width: 70,
            child: Text(
              CurrencyFormatter.formatINR(item.subtotal),
              textAlign: TextAlign.end,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/utils/date_formatter.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_status_enum.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

class OrderItemCard extends StatelessWidget {
  final OrderModel order;
  final VoidCallback onTap;

  const OrderItemCard({
    super.key,
    required this.order,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final status = OrderStatus.fromString(order.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.cardBackground(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Restaurant & Status Badge
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.restaurantName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        if (order.createdAt != null)
                          Text(
                            DateFormatter.formatDate(order.createdAt!),
                            style: const TextStyle(fontSize: 11, color: AppColors.neutralGray),
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: status.color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status.label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: status.color,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),

              // Items summary
              if (order.orderItems.isNotEmpty)
                Text(
                  order.orderItems.map((e) => '${e.quantity}x ${e.menuItemName}').join(', '),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppColors.neutralGray),
                )
              else
                Text(
                  'Order #${order.id}',
                  style: const TextStyle(fontSize: 12, color: AppColors.neutralGray),
                ),
              const SizedBox(height: 12),

              // Total and Track Action
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    CurrencyFormatter.formatINR(order.finalAmount > 0 ? order.finalAmount : order.totalAmount),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  Row(
                    children: [
                      Text(
                        status == OrderStatus.delivered ? 'View Details' : 'Track Order',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryRed,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_forward_ios, size: 12, color: AppColors.primaryRed),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

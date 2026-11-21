import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_status_enum.dart';

class OrderStatusTimeline extends StatelessWidget {
  final OrderStatus currentStatus;

  const OrderStatusTimeline({
    super.key,
    required this.currentStatus,
  });

  @override
  Widget build(BuildContext context) {
    if (currentStatus == OrderStatus.cancelled) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.primaryRed.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primaryRed.withOpacity(0.3)),
        ),
        child: const Row(
          children: [
            Icon(Icons.cancel, color: AppColors.primaryRed, size: 24),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Order Cancelled', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryRed)),
                Text('Refund has been processed to your payment source', style: TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ],
        ),
      );
    }

    final steps = [
      OrderStatus.placed,
      OrderStatus.confirmed,
      OrderStatus.preparing,
      OrderStatus.outForDelivery,
      OrderStatus.delivered,
    ];

    final activeIndex = currentStatus.step;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Live Order Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          Column(
            children: List.generate(steps.length, (index) {
              final step = steps[index];
              final isDone = activeIndex > index;
              final isCurrent = activeIndex == index;
              final isPending = activeIndex < index;
              final isLast = index == steps.length - 1;

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Dot and vertical line
                    Column(
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: isDone
                                ? AppColors.vegGreen
                                : isCurrent
                                    ? AppColors.primaryRed
                                    : Colors.grey.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isDone ? Icons.check : step.icon,
                            size: 13,
                            color: isPending ? Colors.grey : Colors.white,
                          ),
                        ),
                        if (!isLast)
                          Expanded(
                            child: Container(
                              width: 2,
                              color: isDone ? AppColors.vegGreen : Colors.grey.withOpacity(0.2),
                              margin: const EdgeInsets.symmetric(vertical: 4),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(width: 14),

                    // Label and Subtitle
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 18.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              step.label,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isCurrent ? FontWeight.bold : FontWeight.w600,
                                color: isPending ? Colors.grey : null,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              step.subtitle,
                              style: TextStyle(
                                fontSize: 11,
                                color: isCurrent ? AppColors.primaryRed : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

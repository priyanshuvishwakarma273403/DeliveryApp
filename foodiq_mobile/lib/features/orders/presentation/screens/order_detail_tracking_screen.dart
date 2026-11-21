import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/features/orders/presentation/controllers/live_tracking_controller.dart';
import 'package:foodiq_mobile/features/orders/presentation/widgets/cancel_order_dialog.dart';
import 'package:foodiq_mobile/features/orders/presentation/widgets/live_tracking_map.dart';
import 'package:foodiq_mobile/features/orders/presentation/widgets/order_status_timeline.dart';
import 'package:foodiq_mobile/features/orders/presentation/widgets/order_twin_card.dart';

class OrderDetailTrackingScreen extends ConsumerWidget {
  final int orderId;

  const OrderDetailTrackingScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trackingState = ref.watch(liveTrackingControllerProvider(orderId));

    if (trackingState.isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Order #$orderId')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final order = trackingState.order;
    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Order #$orderId')),
        body: const Center(child: Text('Order not found')),
      );
    }

    final rider = order.delivery;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Order #$orderId', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(order.restaurantName, style: const TextStyle(fontSize: 11, color: AppColors.neutralGray)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Live Map Canvas
            LiveTrackingMap(
              riderLocation: trackingState.riderLocation,
              restaurantName: order.restaurantName,
              deliveryAddress: order.deliveryAddress,
              etaMinutes: trackingState.etaMinutes,
              distanceKm: trackingState.distanceKm,
            ),
            const SizedBox(height: 16),

            // Live Order Status Stepper
            OrderStatusTimeline(currentStatus: trackingState.currentStatus),
            const SizedBox(height: 16),

            // AI Order Brain Digital Twin Card
            if (trackingState.twin != null) ...[
              OrderTwinCard(twin: trackingState.twin!),
              const SizedBox(height: 16),
            ],

            // Delivery Partner Info (If Assigned)
            if (rider != null && rider.deliveryPartnerName != null)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.cardBackground(Theme.of(context).brightness),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.withOpacity(0.15)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppColors.accentOrange.withOpacity(0.15),
                      child: const Icon(Icons.two_wheeler, color: AppColors.accentOrange, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            rider.deliveryPartnerName!,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          Text(
                            'Delivery Partner • ${rider.status ?? 'On the way'}',
                            style: const TextStyle(fontSize: 11, color: AppColors.neutralGray),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.phone, color: AppColors.vegGreen),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Calling rider: ${rider.deliveryPartnerPhone ?? 'Connecting...'}')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            if (rider != null && rider.deliveryPartnerName != null) const SizedBox(height: 16),

            // Delivery Address Destination
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.cardBackground(Theme.of(context).brightness),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.withOpacity(0.15)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.location_on, color: AppColors.primaryRed, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Delivery Destination', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 2),
                        Text(order.deliveryAddress, style: const TextStyle(fontSize: 12, color: AppColors.neutralGray)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Items Ordered Summary
            if (order.orderItems.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.cardBackground(Theme.of(context).brightness),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.withOpacity(0.15)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Items Ordered', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 10),
                    ...order.orderItems.map((item) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${item.quantity}x ${item.menuItemName}', style: const TextStyle(fontSize: 13)),
                            Text(CurrencyFormatter.formatINR(item.subtotal), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      );
                    }),
                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Paid', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(
                          CurrencyFormatter.formatINR(order.finalAmount > 0 ? order.finalAmount : order.totalAmount),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.primaryRed),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 20),

            // Cancel Order Action (if cancellable)
            if (order.isCancellable)
              AppButton(
                text: 'Cancel Order',
                type: AppButtonType.outline,
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => CancelOrderDialog(
                      orderId: orderId,
                      onConfirmCancel: (reason) async {
                        final ok = await ref
                            .read(liveTrackingControllerProvider(orderId).notifier)
                            .cancelOrder(reason);
                        if (ok && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Order cancelled successfully')),
                          );
                        }
                      },
                    ),
                  );
                },
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/widgets/empty_state_view.dart';
import 'package:foodiq_mobile/core/widgets/error_view.dart';
import 'package:foodiq_mobile/features/orders/presentation/controllers/order_history_controller.dart';
import 'package:foodiq_mobile/features/orders/presentation/widgets/order_item_card.dart';

class OrderHistoryScreen extends ConsumerWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(orderHistoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orders', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: ordersAsync.when(
        data: (orders) {
          if (orders.isEmpty) {
            return EmptyStateView(
              title: 'No orders yet',
              message: 'When you place orders, they will show up here with live status updates and receipts.',
              icon: Icons.receipt_long_outlined,
              actionLabel: 'Explore FoodIQ',
              onAction: () => context.go('/customer'),
            );
          }

          return RefreshIndicator(
            color: AppColors.primaryRed,
            onRefresh: () async {
              await ref.read(orderHistoryProvider.notifier).refresh();
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length,
              itemBuilder: (context, index) {
                final order = orders[index];
                return OrderItemCard(
                  order: order,
                  onTap: () {
                    context.push('/orders/${order.id}');
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(
          message: err.toString(),
          onRetry: () => ref.read(orderHistoryProvider.notifier).refresh(),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/core/widgets/app_card.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/delivery/presentation/controllers/rider_console_controller.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

class DeliveryDashboardShell extends ConsumerWidget {
  const DeliveryDashboardShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final riderState = ref.watch(riderConsoleControllerProvider);
    final riderNotifier = ref.read(riderConsoleControllerProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Rider Console', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.swap_horiz_rounded),
            tooltip: 'Switch Portal',
            onPressed: () => context.push(RoutePaths.rolePortal),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go(RoutePaths.login);
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Duty Status Card
          AppCard(
            backgroundColor: riderState.isOnline
                ? AppColors.vegGreen.withOpacity(0.08)
                : Colors.red.withOpacity(0.08),
            border: Border.all(
              color: riderState.isOnline ? AppColors.vegGreen : Colors.red,
              width: 1.5,
            ),
            child: Row(
              children: [
                Icon(
                  riderState.isOnline ? Icons.radar_rounded : Icons.power_settings_new_rounded,
                  color: riderState.isOnline ? AppColors.vegGreen : Colors.red,
                  size: 32,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        riderState.isOnline ? 'Online & Ready for Runs' : 'You are currently Offline',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      Text(
                        riderState.isOnline
                            ? 'Broadcasting GPS over /app/location & scanning orders...'
                            : 'Switch online to start accepting delivery orders.',
                        style: const TextStyle(fontSize: 11, color: AppColors.neutralGray),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: riderState.isOnline,
                  activeColor: AppColors.vegGreen,
                  onChanged: (val) => riderNotifier.toggleDutyStatus(val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Active Run (If rider accepted an order)
          if (riderState.activeRun != null) ...[
            const Text('Active Delivery Run', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.primaryRed, width: 1.5),
                boxShadow: [
                  BoxShadow(color: AppColors.primaryRed.withOpacity(0.1), blurRadius: 10),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Order #${riderState.activeRun!.id}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: AppColors.primaryRed.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
                        child: Text(
                          riderState.activeRun!.status,
                          style: const TextStyle(color: AppColors.primaryRed, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.storefront, color: AppColors.primaryRed, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(riderState.activeRun!.restaurantName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: AppColors.vegGreen, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(riderState.activeRun!.deliveryAddress, style: const TextStyle(fontSize: 12))),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    children: [
                      if (riderState.activeRun!.status == 'OUT_FOR_DELIVERY')
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentOrange, foregroundColor: Colors.white),
                            onPressed: () => riderNotifier.markPickedUp(riderState.activeRun!.id),
                            child: const Text('Mark Picked Up'),
                          ),
                        ),
                      if (riderState.activeRun!.status == 'PICKED_UP')
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.vegGreen, foregroundColor: Colors.white),
                            onPressed: () => riderNotifier.markDelivered(riderState.activeRun!.id),
                            child: const Text('Complete Delivery'),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Available Runs List
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Available Orders Nearby', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              if (riderState.isOnline)
                IconButton(
                  icon: const Icon(Icons.refresh, size: 20),
                  onPressed: () => riderNotifier.loadAvailableGigs(),
                ),
            ],
          ),
          const SizedBox(height: 10),

          if (!riderState.isOnline)
            AppCard(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    children: const [
                      Icon(Icons.power_settings_new, size: 36, color: Colors.grey),
                      SizedBox(height: 8),
                      Text('Switch Online to scan for live pickup gigs.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                    ],
                  ),
                ),
              ),
            )
          else if (riderState.availableOrders.isEmpty)
            AppCard(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    children: const [
                      Icon(Icons.check_circle_outline, size: 36, color: AppColors.vegGreen),
                      SizedBox(height: 8),
                      Text('All nearby deliveries are currently assigned. Radar is scanning...', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
              ),
            )
          else
            ...riderState.availableOrders.map((order) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.withOpacity(0.15)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Order #${order.id}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: AppColors.vegGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                          child: const Text('Earn ₹65', style: TextStyle(color: AppColors.vegGreen, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(order.restaurantName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text(order.deliveryAddress, style: const TextStyle(fontSize: 11, color: AppColors.neutralGray)),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: AppButton(
                        text: 'Accept Run',
                        height: 38,
                        onPressed: () => riderNotifier.acceptOrder(order),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

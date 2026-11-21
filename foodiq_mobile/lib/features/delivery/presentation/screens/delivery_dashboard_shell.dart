import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/core/widgets/app_card.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';

class DeliveryDashboardShell extends ConsumerStatefulWidget {
  const DeliveryDashboardShell({super.key});

  @override
  ConsumerState<DeliveryDashboardShell> createState() => _DeliveryDashboardShellState();
}

class _DeliveryDashboardShellState extends ConsumerState<DeliveryDashboardShell> {
  bool _isOnline = false;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Rider Console'),
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
        padding: const EdgeInsets.all(20),
        children: [
          // Duty Status Card
          AppCard(
            backgroundColor: _isOnline
                ? AppColors.success.withOpacity(0.08)
                : AppColors.error.withOpacity(0.08),
            border: Border.all(
              color: _isOnline ? AppColors.success : AppColors.error,
              width: 1.5,
            ),
            child: Row(
              children: [
                Icon(
                  _isOnline ? Icons.radar_rounded : Icons.power_settings_new_rounded,
                  color: _isOnline ? AppColors.success : AppColors.error,
                  size: 32,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isOnline ? 'Online & Available for Runs' : 'You are currently Offline',
                        style: AppTypography.titleMedium(),
                      ),
                      Text(
                        _isOnline
                          ? 'Listening on /topic/location and available orders...'
                          : 'Switch online to start accepting delivery runs.',
                        style: AppTypography.bodySmall(),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _isOnline,
                  activeColor: AppColors.success,
                  onChanged: (val) {
                    setState(() => _isOnline = val);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Available Deliveries Nearby', style: AppTypography.titleLarge()),
          const SizedBox(height: 12),
          if (!_isOnline)
            AppCard(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: Text(
                    'Go Online to scan for live orders.',
                    style: AppTypography.bodyMedium(),
                  ),
                ),
              ),
            )
          else ...[
            _deliveryRunCard(
              orderId: '#ORD-9842',
              restaurantName: 'Burger King – Sector 62',
              customerAddress: 'H.No 120, Block B, Noida',
              payout: '₹65',
              distance: '2.4 km',
            ),
            const SizedBox(height: 12),
            _deliveryRunCard(
              orderId: '#ORD-9845',
              restaurantName: 'Biryani Blues – Connaught Place',
              customerAddress: 'Tower 4, Barakhamba Rd, New Delhi',
              payout: '₹85',
              distance: '4.1 km',
            ),
          ],
        ],
      ),
    );
  }

  Widget _deliveryRunCard({
    required String orderId,
    required String restaurantName,
    required String customerAddress,
    required String payout,
    required String distance,
  }) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(orderId, style: const TextStyle(fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  payout,
                  style: const TextStyle(
                    color: AppColors.success,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.storefront_rounded, size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Expanded(child: Text(restaurantName, style: AppTypography.bodyMedium())),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.location_on_rounded, size: 16, color: AppColors.secondary),
              const SizedBox(width: 6),
              Expanded(child: Text(customerAddress, style: AppTypography.bodySmall())),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Text('Distance: $distance', style: AppTypography.labelSmall()),
              const Spacer(),
              AppButton(
                text: 'Accept Run',
                height: 38,
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Accepted order $orderId')),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

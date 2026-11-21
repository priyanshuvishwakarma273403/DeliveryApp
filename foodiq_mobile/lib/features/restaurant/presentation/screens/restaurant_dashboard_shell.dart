import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_card.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';

class RestaurantDashboardShell extends ConsumerWidget {
  const RestaurantDashboardShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Restaurant Operations'),
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
          AppCard(
            backgroundColor: Colors.indigo.withOpacity(0.08),
            border: Border.all(color: Colors.indigo.withOpacity(0.2)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.storefront_rounded, color: Colors.indigo),
                    const SizedBox(width: 8),
                    Text('Branch Manager / Owner Console', style: AppTypography.titleMedium()),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Connected as: ${user?.name ?? 'Manager'} (${user?.role.toDisplayString() ?? 'Staff'})',
                  style: AppTypography.bodySmall(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('Operational Workflows', style: AppTypography.titleLarge()),
          const SizedBox(height: 14),
          _actionItem(Icons.restaurant_menu_rounded, 'Menu Items & Stock', 'Toggle in-stock dish availability'),
          const SizedBox(height: 10),
          _actionItem(Icons.kitchen_rounded, 'Kitchen Display System (KDS)', 'Live prep task queues and station state'),
          const SizedBox(height: 10),
          _actionItem(Icons.receipt_long_rounded, 'Branch Orders', 'Manage active and pending takeaway orders'),
          const SizedBox(height: 10),
          _actionItem(Icons.analytics_outlined, 'Digital Twin & Forecast', 'Kitchen prep plans and demand intelligence'),
        ],
      ),
    );
  }

  Widget _actionItem(IconData icon, String title, String subtitle) {
    return AppCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.indigo.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.indigo),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.titleMedium()),
                const SizedBox(height: 2),
                Text(subtitle, style: AppTypography.bodySmall()),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.textMutedLight),
        ],
      ),
    );
  }
}

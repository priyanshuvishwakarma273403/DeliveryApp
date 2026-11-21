import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_card.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';

class AdminDashboardShell extends ConsumerWidget {
  const AdminDashboardShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Admin Ops Hub'),
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
            backgroundColor: Colors.deepPurple.withOpacity(0.08),
            border: Border.all(color: Colors.deepPurple.withOpacity(0.2)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.security_rounded, color: Colors.deepPurple),
                    const SizedBox(width: 8),
                    Text('Platform Command Center', style: AppTypography.titleMedium()),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Administrator: ${user?.name ?? 'Admin'} (${user?.role.toDisplayString() ?? 'Admin'})',
                  style: AppTypography.bodySmall(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('Platform Administration', style: AppTypography.titleLarge()),
          const SizedBox(height: 14),
          _adminFeatureTile(Icons.dashboard_rounded, 'Live Ops Center', 'System metrics, active riders & orders'),
          const SizedBox(height: 10),
          _adminFeatureTile(Icons.people_alt_rounded, 'IAM & User Roles', 'Manage RBAC permissions and user accounts'),
          const SizedBox(height: 10),
          _adminFeatureTile(Icons.store_rounded, 'Restaurant Directory', 'Approve restaurants, update menus'),
          const SizedBox(height: 10),
          _adminFeatureTile(Icons.gavel_rounded, 'Trust & Fraud Radar', 'Automated anomaly flags and blacklists'),
          const SizedBox(height: 10),
          _adminFeatureTile(Icons.account_balance_wallet_rounded, 'Finance & Payouts', 'Driver weekly settlements and refunds'),
        ],
      ),
    );
  }

  Widget _adminFeatureTile(IconData icon, String title, String subtitle) {
    return AppCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.deepPurple.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.deepPurple),
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

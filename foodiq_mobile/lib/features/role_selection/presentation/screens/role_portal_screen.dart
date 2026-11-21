import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_card.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';

class RolePortalScreen extends ConsumerWidget {
  const RolePortalScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final userRole = user?.role ?? UserRole.customer;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Role Portals'),
        actions: [
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
          Text(
            'Authorized Workspace Portals',
            style: AppTypography.headlineSmall(),
          ),
          const SizedBox(height: 6),
          Text(
            'Logged in as: ${user?.name ?? 'User'} (${userRole.toDisplayString()})',
            style: AppTypography.bodyMedium(),
          ),
          const SizedBox(height: 24),
          _portalCard(
            context: context,
            title: 'Customer Food Experience',
            subtitle: 'Discover top restaurants, order food, track orders live.',
            icon: Icons.fastfood_rounded,
            color: AppColors.primary,
            route: RoutePaths.customerDashboard,
            isAllowed: true,
          ),
          const SizedBox(height: 14),
          _portalCard(
            context: context,
            title: 'Delivery Partner Console',
            subtitle: 'Radar scan for pickup runs, accept orders, broadcast GPS coordinates.',
            icon: Icons.two_wheeler_rounded,
            color: AppColors.secondary,
            route: RoutePaths.deliveryDashboard,
            isAllowed: userRole == UserRole.deliveryPartner ||
                userRole == UserRole.admin ||
                userRole == UserRole.superAdmin,
          ),
          const SizedBox(height: 14),
          _portalCard(
            context: context,
            title: 'Restaurant Operations',
            subtitle: 'Manage menus, kitchen display tasks (KDS), orders, and prep plans.',
            icon: Icons.storefront_rounded,
            color: Colors.indigo,
            route: RoutePaths.restaurantDashboard,
            isAllowed: userRole == UserRole.restaurantOwner ||
                userRole == UserRole.branchManager ||
                userRole == UserRole.admin ||
                userRole == UserRole.superAdmin,
          ),
          const SizedBox(height: 14),
          _portalCard(
            context: context,
            title: 'Administrator Operations Hub',
            subtitle: 'Platform analytics, digital twins, IAM roles, fraud center, finance.',
            icon: Icons.admin_panel_settings_rounded,
            color: Colors.deepPurple,
            route: RoutePaths.adminDashboard,
            isAllowed: userRole == UserRole.admin ||
                userRole == UserRole.superAdmin ||
                userRole == UserRole.supportExecutive,
          ),
        ],
      ),
    );
  }

  Widget _portalCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required String route,
    required bool isAllowed,
  }) {
    return AppCard(
      onTap: isAllowed
          ? () => context.go(route)
          : () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Access restricted: Role-based authorization required.'),
                ),
              );
            },
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isAllowed ? color.withOpacity(0.12) : Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              icon,
              color: isAllowed ? color : Colors.grey,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: AppTypography.titleMedium(),
                      ),
                    ),
                    if (!isAllowed)
                      const Icon(Icons.lock_rounded, size: 16, color: Colors.grey),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: AppTypography.bodySmall(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

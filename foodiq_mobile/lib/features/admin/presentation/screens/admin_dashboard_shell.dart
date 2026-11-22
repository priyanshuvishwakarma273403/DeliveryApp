import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/features/admin/presentation/controllers/admin_ops_controller.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';

class AdminDashboardShell extends ConsumerWidget {
  const AdminDashboardShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adminState = ref.watch(adminOpsControllerProvider);
    final adminNotifier = ref.read(adminOpsControllerProvider.notifier);
    final stats = adminState.stats;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Admin Platform Ops', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => adminNotifier.loadDashboard(),
          ),
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
      body: adminState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Platform KPI Metrics Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricTile(
                        'Total Revenue',
                        CurrencyFormatter.formatINR((stats['totalRevenue'] is num) ? (stats['totalRevenue'] as num).toDouble() : 845200.0),
                        Icons.currency_rupee,
                        Colors.green,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildMetricTile(
                        'Live Orders',
                        '${stats['activeOrders'] ?? 38}',
                        Icons.delivery_dining,
                        AppColors.primaryRed,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricTile(
                        'Active Riders',
                        '${stats['activeDrivers'] ?? 64}',
                        Icons.motorcycle,
                        Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildMetricTile(
                        'System Health',
                        '${stats['systemHealth'] ?? '99.8%'}',
                        Icons.health_and_safety,
                        Colors.teal,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Live Platform Orders
                const Text('Platform Orders Oversight', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 10),
                if (adminState.orders.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: const Center(child: Text('No orders found', style: TextStyle(color: Colors.grey))),
                  )
                else
                  ...adminState.orders.map((order) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
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
                              Text('Order #${order.id} • ${order.restaurantName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                                child: Text(order.status, style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 10)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('Customer: ${order.customerName} • ${CurrencyFormatter.formatINR(order.finalAmount)}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              PopupMenuButton<String>(
                                onSelected: (status) => adminNotifier.updateOrderStatus(order.id, status),
                                itemBuilder: (ctx) => [
                                  const PopupMenuItem(value: 'PREPARING', child: Text('Force Preparing')),
                                  const PopupMenuItem(value: 'OUT_FOR_DELIVERY', child: Text('Force Out for Delivery')),
                                  const PopupMenuItem(value: 'DELIVERED', child: Text('Force Completed')),
                                  const PopupMenuItem(value: 'CANCELLED', child: Text('Cancel & Trigger Refund', style: TextStyle(color: Colors.red))),
                                ],
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.grey.withOpacity(0.3)),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text('Status Override', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                      SizedBox(width: 4),
                                      Icon(Icons.arrow_drop_down, size: 16),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
    );
  }

  Widget _buildMetricTile(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.12), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/restaurant/presentation/controllers/kds_controller.dart';

class RestaurantDashboardShell extends ConsumerStatefulWidget {
  const RestaurantDashboardShell({super.key});

  @override
  ConsumerState<RestaurantDashboardShell> createState() => _RestaurantDashboardShellState();
}

class _RestaurantDashboardShellState extends ConsumerState<RestaurantDashboardShell> {
  bool _isOpen = true;
  final String _restaurantId = 'rest_01'; // Default active branch ID

  @override
  Widget build(BuildContext context) {
    final kdsState = ref.watch(kdsControllerProvider(_restaurantId));
    final kdsNotifier = ref.read(kdsControllerProvider(_restaurantId).notifier);
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('KDS Kitchen Console', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            Text('${user?.name ?? 'Manager'} • ${_isOpen ? 'OPEN' : 'CLOSED'}', style: TextStyle(fontSize: 11, color: _isOpen ? AppColors.vegGreen : Colors.red, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          Switch(
            value: _isOpen,
            activeColor: AppColors.vegGreen,
            onChanged: (val) => setState(() => _isOpen = val),
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
      body: Column(
        children: [
          // KDS Tabs: NEW / COOKING / READY
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: Row(
              children: [
                _buildTabChip('NEW', 'New Orders', kdsState.activeTab, kdsNotifier),
                const SizedBox(width: 8),
                _buildTabChip('COOKING', 'In Kitchen', kdsState.activeTab, kdsNotifier),
                const SizedBox(width: 8),
                _buildTabChip('READY', 'Food Ready', kdsState.activeTab, kdsNotifier),
              ],
            ),
          ),

          // Orders List
          Expanded(
            child: kdsState.isLoading
                ? const Center(child: CircularProgressIndicator())
                : kdsState.filteredOrders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.soup_kitchen_outlined, size: 48, color: Colors.grey),
                            const SizedBox(height: 8),
                            Text('No orders in ${kdsState.activeTab} stage', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: kdsState.filteredOrders.length,
                        itemBuilder: (context, index) {
                          final order = kdsState.filteredOrders[index];
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
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(color: Colors.orange.withOpacity(0.12), borderRadius: BorderRadius.circular(4)),
                                      child: Text(order.status, style: const TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                if (order.orderItems.isNotEmpty)
                                  ...order.orderItems.map((item) => Text('• ${item.quantity}x ${item.menuItemName}', style: const TextStyle(fontSize: 12))),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    if (kdsState.activeTab == 'NEW')
                                      Expanded(
                                        child: ElevatedButton(
                                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentOrange, foregroundColor: Colors.white),
                                          onPressed: () => kdsNotifier.startCooking(order.id),
                                          child: const Text('Start Cooking'),
                                        ),
                                      ),
                                    if (kdsState.activeTab == 'COOKING')
                                      Expanded(
                                        child: ElevatedButton(
                                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.vegGreen, foregroundColor: Colors.white),
                                          onPressed: () => kdsNotifier.markReady(order.id),
                                          child: const Text('Mark Food Ready'),
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabChip(String tabKey, String label, String activeTab, KdsController notifier) {
    final isSelected = activeTab == tabKey;
    return Expanded(
      child: ChoiceChip(
        label: Center(child: Text(label, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? Colors.white : null))),
        selected: isSelected,
        selectedColor: AppColors.primaryRed,
        onSelected: (_) => notifier.switchTab(tabKey),
      ),
    );
  }
}

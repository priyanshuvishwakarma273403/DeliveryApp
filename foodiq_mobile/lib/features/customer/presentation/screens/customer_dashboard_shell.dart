import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/home/presentation/screens/home_screen.dart';
import 'package:foodiq_mobile/features/location/presentation/controllers/location_controller.dart';
import 'package:foodiq_mobile/features/location/presentation/widgets/location_picker_sheet.dart';
import 'package:foodiq_mobile/features/search/presentation/screens/universal_search_screen.dart';
import 'package:foodiq_mobile/features/cart/presentation/screens/cart_screen.dart';
import 'package:foodiq_mobile/features/cart/presentation/controllers/cart_controller.dart';
import 'package:foodiq_mobile/features/orders/presentation/screens/order_history_screen.dart';
import 'package:foodiq_mobile/features/notifications/presentation/controllers/notification_controller.dart';
import 'package:foodiq_mobile/features/profile/presentation/screens/customer_profile_screen.dart';

class CustomerDashboardShell extends ConsumerStatefulWidget {
  const CustomerDashboardShell({super.key});

  @override
  ConsumerState<CustomerDashboardShell> createState() => _CustomerDashboardShellState();
}

class _CustomerDashboardShellState extends ConsumerState<CustomerDashboardShell> {
  int _currentNavIndex = 0;

  @override
  Widget build(BuildContext context) {
    final activeAddress = ref.watch(activeAddressProvider);
    final cart = ref.watch(cartControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: (_currentNavIndex == 1 || _currentNavIndex == 3 || _currentNavIndex == 4)
          ? null // SearchScreen, CartScreen, and ProfileScreen have their own headers
          : AppBar(
              title: GestureDetector(
                onTap: () => LocationPickerSheet.show(context),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_on_rounded, size: 16, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            activeAddress?.label ?? 'Select Location',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
                      ],
                    ),
                    Text(
                      activeAddress?.addressLine ?? 'Tap to select delivery address',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.labelSmall(),
                    ),
                  ],
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.search_rounded),
                  onPressed: () => setState(() => _currentNavIndex = 1),
                ),
                ref.watch(unreadNotificationCountProvider).when(
                      data: (count) => IconButton(
                        icon: Badge(
                          isLabelVisible: count > 0,
                          label: Text('$count'),
                          child: const Icon(Icons.notifications_none_rounded),
                        ),
                        onPressed: () => context.push(RoutePaths.notifications),
                      ),
                      loading: () => IconButton(
                        icon: const Icon(Icons.notifications_none_rounded),
                        onPressed: () => context.push(RoutePaths.notifications),
                      ),
                      error: (_, __) => IconButton(
                        icon: const Icon(Icons.notifications_none_rounded),
                        onPressed: () => context.push(RoutePaths.notifications),
                      ),
                    ),
                IconButton(
                  icon: const Icon(Icons.apps_rounded),
                  tooltip: 'Role Switcher',
                  onPressed: () => context.push(RoutePaths.rolePortal),
                ),
              ],
            ),
      body: _buildCurrentTab(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentNavIndex,
        onDestinationSelected: (index) {
          setState(() => _currentNavIndex = index);
        },
        destinations: [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded, color: AppColors.primary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_rounded),
            selectedIcon: Icon(Icons.search_rounded, color: AppColors.primary),
            label: 'Search',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long_rounded, color: AppColors.primary),
            label: 'Orders',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: cart.totalItems > 0,
              label: Text('${cart.totalItems}'),
              child: const Icon(Icons.shopping_bag_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: cart.totalItems > 0,
              label: Text('${cart.totalItems}'),
              child: const Icon(Icons.shopping_bag_rounded, color: AppColors.primary),
            ),
            label: 'Cart',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded, color: AppColors.primary),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentTab() {
    switch (_currentNavIndex) {
      case 0:
        return HomeScreen(
          onSearchTap: () => setState(() => _currentNavIndex = 1),
        );
      case 1:
        return const UniversalSearchScreen();
      case 2:
        return _buildOrdersTab();
      case 3:
        return _buildCartTab();
      case 4:
        return _buildProfileTab();
      default:
        return HomeScreen(
          onSearchTap: () => setState(() => _currentNavIndex = 1),
        );
    }
  }

  Widget _buildOrdersTab() {
    return const OrderHistoryScreen();
  }

  Widget _buildCartTab() {
    return const CartScreen();
  }

  Widget _buildProfileTab() {
    return const CustomerProfileScreen();
  }
}

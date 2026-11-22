import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/location/presentation/widgets/location_picker_sheet.dart';
import 'package:foodiq_mobile/features/profile/presentation/controllers/wallet_controller.dart';
import 'package:foodiq_mobile/features/profile/presentation/widgets/gold_membership_card.dart';
import 'package:foodiq_mobile/features/profile/presentation/widgets/wallet_balance_card.dart';

class CustomerProfileScreen extends ConsumerWidget {
  const CustomerProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.user;
    final walletAsync = ref.watch(walletControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. User Header
          Row(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: AppColors.primaryRed.withOpacity(0.12),
                child: Text(
                  user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'U',
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.primaryRed),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user?.name ?? 'User', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                    Text(user?.email ?? '', style: const TextStyle(fontSize: 12, color: AppColors.neutralGray)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primaryRed.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        user?.role.toDisplayString() ?? 'Customer',
                        style: const TextStyle(color: AppColors.primaryRed, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 2. FoodIQ Gold VIP Card
          walletAsync.when(
            data: (wallet) => GoldMembershipCard(
              isGold: wallet.isGoldMember,
              onUpgrade: () async {
                final ok = await ref.read(walletControllerProvider.notifier).upgradeToGold();
                if (ok && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Welcome to FoodIQ Gold VIP!')),
                  );
                }
              },
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 14),

          // 3. Wallet & Coins Summary
          walletAsync.when(
            data: (wallet) => WalletBalanceCard(
              balance: wallet.balance,
              onRedeemGiftCard: () => _showRedeemDialog(context, ref),
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 20),

          const Text('FOODIQ INTELLIGENCE & DISCOVERY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.neutralGray)),
          const SizedBox(height: 8),

          // 4. AI Taste DNA
          _buildMenuTile(
            icon: Icons.fingerprint,
            title: 'My Taste DNA',
            subtitle: 'Flavor matrix, preferred cuisines & allergy exclusions',
            onTap: () => context.push('/taste-dna'),
          ),

          // 5. AI Food Concierge
          _buildMenuTile(
            icon: Icons.chat_bubble_outline_rounded,
            title: 'FoodIQ AI Food Concierge',
            subtitle: 'Get instant personalized dish suggestions',
            onTap: () => context.push('/food-concierge'),
          ),

          const SizedBox(height: 16),
          const Text('ORDERS & ADDRESSES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.neutralGray)),
          const SizedBox(height: 8),

          // 6. My Orders
          _buildMenuTile(
            icon: Icons.receipt_long_outlined,
            title: 'Orders & Reorder',
            subtitle: 'Live order tracking, history & digital twin',
            onTap: () => context.push(RoutePaths.orders),
          ),

          // 7. Delivery Addresses
          _buildMenuTile(
            icon: Icons.location_on_outlined,
            title: 'Saved Delivery Addresses',
            subtitle: 'Manage Home, Office & Other locations',
            onTap: () => LocationPickerSheet.show(context),
          ),

          const SizedBox(height: 16),
          const Text('SUPPORT & NOTIFICATIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.neutralGray)),
          const SizedBox(height: 8),

          // 8. Support Tickets
          _buildMenuTile(
            icon: Icons.headset_mic_outlined,
            title: 'Support Tickets & Disputes',
            subtitle: 'Help with past orders, refunds & deliveries',
            onTap: () => context.push('/support-tickets'),
          ),

          // 9. Notifications
          _buildMenuTile(
            icon: Icons.notifications_none_rounded,
            title: 'Notifications & Alerts',
            subtitle: 'Order updates and promotional offers',
            onTap: () => context.push(RoutePaths.notifications),
          ),

          // 10. Role Switcher
          _buildMenuTile(
            icon: Icons.dashboard_customize_outlined,
            title: 'Role Switcher Portal',
            subtitle: 'Access Driver, Restaurant, or Admin consoles',
            onTap: () => context.push(RoutePaths.rolePortal),
          ),

          const SizedBox(height: 24),

          // Sign Out Action
          AppButton(
            text: 'Sign Out',
            type: AppButtonType.outline,
            icon: Icons.logout_rounded,
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go(RoutePaths.login);
            },
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildMenuTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.12)),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primaryRed.withOpacity(0.08),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.primaryRed, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.neutralGray)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.grey),
      ),
    );
  }

  void _showRedeemDialog(BuildContext context, WidgetRef ref) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Redeem Gift Card'),
        content: TextField(
          controller: controller,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            hintText: 'Enter Gift Card Code (FIQ-...)',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryRed),
            onPressed: () async {
              final code = controller.text.trim();
              if (code.isNotEmpty) {
                final ok = await ref.read(walletControllerProvider.notifier).redeemCard(code);
                Navigator.pop(ctx);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(ok ? 'Gift card redeemed successfully!' : 'Invalid or expired code')),
                  );
                }
              }
            },
            child: const Text('Redeem', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

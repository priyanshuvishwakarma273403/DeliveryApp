import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/core/widgets/empty_state_view.dart';
import 'package:foodiq_mobile/features/cart/presentation/controllers/cart_controller.dart';
import 'package:foodiq_mobile/features/cart/presentation/widgets/allergy_guardian_banner.dart';
import 'package:foodiq_mobile/features/cart/presentation/widgets/bill_breakdown_card.dart';
import 'package:foodiq_mobile/features/cart/presentation/widgets/cart_item_row.dart';
import 'package:foodiq_mobile/features/cart/presentation/widgets/combo_recommendation_card.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final TextEditingController _instructionsController = TextEditingController();

  @override
  void dispose() {
    _instructionsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider);
    final combosAsync = ref.watch(smartCombosProvider);

    if (cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Cart')),
        body: EmptyStateView(
          title: 'Your cart is empty',
          message: 'Looks like you have not added anything to your cart yet. Explore delicious meals from nearby restaurants!',
          icon: Icons.shopping_basket_outlined,
          actionLabel: 'Browse Restaurants',
          onAction: () => context.go(RoutePaths.customerDashboard),
        ),
      );
    }

    final subtotal = cart.subtotal;
    const packaging = 20.0;
    const delivery = 40.0;
    const platform = 5.0;
    final taxes = (subtotal * 0.05).roundToDouble();
    final grandTotal = subtotal + packaging + delivery + platform + taxes;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('My Cart', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            if (cart.restaurantName != null)
              Text(
                cart.restaurantName!,
                style: const TextStyle(fontSize: 12, color: AppColors.neutralGray),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppColors.primaryRed),
            tooltip: 'Clear Cart',
            onPressed: () => _showClearCartConfirmation(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Restaurant Banner Header
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.cardBackground(Theme.of(context).brightness),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.withOpacity(0.15)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.restaurant, color: AppColors.primaryRed, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          cart.restaurantName ?? 'Selected Restaurant',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Estimated Delivery: 25 - 35 mins',
                          style: TextStyle(fontSize: 11, color: AppColors.neutralGray),
                        ),
                      ],
                    ),
                  ),
                  if (cart.restaurantId != null)
                    TextButton(
                      onPressed: () {
                        context.push('/restaurants/${cart.restaurantId}');
                      },
                      child: const Text('+ Add More', style: TextStyle(fontSize: 12)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Cart Items List
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.cardBackground(Theme.of(context).brightness),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.withOpacity(0.15)),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: cart.items.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final item = cart.items[index];
                  return CartItemRow(
                    item: item,
                    onQuantityChanged: (newQty) {
                      ref
                          .read(cartControllerProvider.notifier)
                          .updateQuantity(item.menuItemId, newQty);
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 12),

            // Allergy Guardian Warning
            AllergyGuardianBanner(items: cart.items),

            // Smart Combos Recommendation Section
            combosAsync.when(
              data: (combos) {
                if (combos.isEmpty) return const SizedBox.shrink();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        Icon(Icons.auto_awesome, color: AppColors.accentOrange, size: 18),
                        SizedBox(width: 6),
                        Text(
                          'Frequently Bought Together',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 130,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: combos.length,
                        itemBuilder: (context, idx) {
                          final combo = combos[idx];
                          return ComboRecommendationCard(
                            combo: combo,
                            onAddCombo: () {
                              for (final m in combo.items) {
                                ref.read(cartControllerProvider.notifier).addItem(
                                      menuItem: m,
                                      restaurantId: cart.restaurantId ?? '',
                                      restaurantName: cart.restaurantName ?? '',
                                    );
                              }
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Added ${combo.name} items to cart!'),
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            },
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),

            // Special Cooking / Delivery Instructions
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.cardBackground(Theme.of(context).brightness),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.withOpacity(0.15)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.note_alt_outlined, size: 20, color: AppColors.neutralGray),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _instructionsController,
                      decoration: const InputDecoration(
                        hintText: 'Add cooking / delivery instructions...',
                        hintStyle: TextStyle(fontSize: 12, color: AppColors.neutralGray),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 8),
                      ),
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Bill Breakdown
            BillBreakdownCard(
              subtotal: subtotal,
              packagingCharge: packaging,
              deliveryCharge: delivery,
              platformFee: platform,
              taxes: taxes,
              finalAmount: grandTotal,
            ),
            const SizedBox(height: 80), // Space for bottom checkout bar
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total to Pay', style: TextStyle(fontSize: 11, color: AppColors.neutralGray)),
                  Text(
                    CurrencyFormatter.formatINR(grandTotal),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: AppButton(
                  text: 'Proceed to Checkout',
                  onPressed: () {
                    context.push(
                      RoutePaths.checkout,
                      extra: {
                        'instructions': _instructionsController.text.trim(),
                        'estimatedSubtotal': subtotal,
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showClearCartConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Cart?'),
        content: const Text('Are you sure you want to remove all items from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryRed),
            onPressed: () {
              ref.read(cartControllerProvider.notifier).clearCart();
              Navigator.pop(ctx);
            },
            child: const Text('Clear', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

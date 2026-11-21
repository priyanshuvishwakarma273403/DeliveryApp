import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/features/cart/presentation/controllers/cart_controller.dart';
import 'package:foodiq_mobile/features/cart/presentation/widgets/bill_breakdown_card.dart';
import 'package:foodiq_mobile/features/checkout/presentation/controllers/checkout_controller.dart';
import 'package:foodiq_mobile/features/checkout/presentation/widgets/delivery_instruction_picker.dart';
import 'package:foodiq_mobile/features/checkout/presentation/widgets/tip_selector.dart';
import 'package:foodiq_mobile/features/location/presentation/controllers/location_controller.dart';
import 'package:foodiq_mobile/features/location/presentation/widgets/location_picker_sheet.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  final String? initialInstructions;

  const CheckoutScreen({super.key, this.initialInstructions});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final TextEditingController _promoController = TextEditingController();

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider);
    final locationState = ref.watch(locationControllerProvider);
    final checkoutState = ref.watch(checkoutControllerProvider);

    final selectedAddress = locationState.selectedAddress;
    final pricing = checkoutState.pricing;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      body: checkoutState.isLoading && pricing == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Delivery Destination Card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.cardBackground(Theme.of(context).brightness),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.withOpacity(0.15)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.location_on, color: AppColors.primaryRed, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Deliver to: ${selectedAddress?.label ?? 'Address'}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const Spacer(),
                            TextButton(
                              onPressed: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  builder: (_) => const LocationPickerSheet(),
                                );
                              },
                              child: const Text('Change', style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                        Text(
                          selectedAddress?.addressLine ?? 'Select your delivery address',
                          style: const TextStyle(fontSize: 12, color: AppColors.neutralGray),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.vegGreen.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.timer_outlined, size: 14, color: AppColors.vegGreen),
                              const SizedBox(width: 4),
                              Text(
                                'Estimated Delivery: ${pricing?.estimatedDeliveryTime ?? '25 - 35 mins'}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.vegGreen,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Delivery Instructions
                  DeliveryInstructionPicker(
                    onInstructionsChanged: (instructions) {
                      ref
                          .read(checkoutControllerProvider.notifier)
                          .setDeliveryInstructions(instructions);
                    },
                  ),
                  const SizedBox(height: 14),

                  // Tip Selector
                  TipSelector(
                    selectedTip: checkoutState.tipAmount,
                    onTipSelected: (tip) {
                      ref.read(checkoutControllerProvider.notifier).setTip(tip);
                    },
                  ),
                  const SizedBox(height: 14),

                  // FoodIQ Coins & Wallet Toggle
                  if (checkoutState.availableCoins > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.cardBackground(Theme.of(context).brightness),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.amber.withOpacity(0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.monetization_on, color: Colors.amber, size: 24),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'FoodIQ Coins',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                Text(
                                  'Available: ${CurrencyFormatter.formatINR(checkoutState.availableCoins)}',
                                  style: const TextStyle(fontSize: 11, color: AppColors.neutralGray),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: checkoutState.useCoins,
                            activeColor: AppColors.primaryRed,
                            onChanged: (val) {
                              ref
                                  .read(checkoutControllerProvider.notifier)
                                  .toggleCoins(val);
                            },
                          ),
                        ],
                      ),
                    ),
                  if (checkoutState.availableCoins > 0) const SizedBox(height: 14),

                  // Coupon Code Input
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.cardBackground(Theme.of(context).brightness),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.withOpacity(0.15)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.local_offer_outlined, color: AppColors.primaryRed, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: _promoController,
                            textCapitalization: TextCapitalization.characters,
                            decoration: const InputDecoration(
                              hintText: 'Enter coupon code (e.g. WELCOME50)',
                              hintStyle: TextStyle(fontSize: 12, color: AppColors.neutralGray),
                              border: InputBorder.none,
                              isDense: true,
                            ),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            final code = _promoController.text.trim();
                            if (code.isNotEmpty) {
                              ref.read(checkoutControllerProvider.notifier).applyPromoCode(code);
                            }
                          },
                          child: const Text('Apply', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Authoritative Bill Breakdown
                  if (pricing != null)
                    BillBreakdownCard(
                      subtotal: pricing.subtotal,
                      packagingCharge: pricing.packagingCharge,
                      deliveryCharge: pricing.deliveryCharge,
                      platformFee: pricing.platformFee,
                      taxes: pricing.totalTaxes,
                      discount: pricing.discount,
                      walletDeduction: pricing.walletDeduction,
                      finalAmount: checkoutState.grandTotalWithTip,
                    ),
                  const SizedBox(height: 80),
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
                  const Text('Final Total', style: TextStyle(fontSize: 11, color: AppColors.neutralGray)),
                  Text(
                    CurrencyFormatter.formatINR(checkoutState.grandTotalWithTip),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: AppButton(
                  text: 'Select Payment Method',
                  onPressed: () {
                    if (selectedAddress == null || selectedAddress.addressLine.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please select a delivery address')),
                      );
                      return;
                    }

                    context.push(
                      '/payment-selection',
                      extra: {
                        'restaurantId': cart.restaurantId,
                        'restaurantName': cart.restaurantName,
                        'deliveryAddress': selectedAddress.addressLine,
                        'instructions': checkoutState.deliveryInstructions,
                        'amount': pricing?.finalAmount ?? cart.subtotal,
                        'walletDeduction': pricing?.walletDeduction ?? 0.0,
                        'useCoins': checkoutState.useCoins,
                        'tipAmount': checkoutState.tipAmount,
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
}

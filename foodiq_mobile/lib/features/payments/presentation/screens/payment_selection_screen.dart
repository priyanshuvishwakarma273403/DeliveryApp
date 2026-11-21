import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_method_enum.dart';
import 'package:foodiq_mobile/features/payments/presentation/controllers/payment_controller.dart';
import 'package:foodiq_mobile/features/payments/presentation/widgets/payment_option_tile.dart';
import 'package:foodiq_mobile/features/payments/presentation/widgets/scratch_card_dialog.dart';

class PaymentSelectionScreen extends ConsumerWidget {
  final String restaurantId;
  final String restaurantName;
  final String deliveryAddress;
  final String? instructions;
  final double amount;
  final double walletDeduction;
  final bool useCoins;
  final double tipAmount;

  const PaymentSelectionScreen({
    super.key,
    required this.restaurantId,
    required this.restaurantName,
    required this.deliveryAddress,
    this.instructions,
    required this.amount,
    this.walletDeduction = 0.0,
    this.useCoins = false,
    this.tipAmount = 0.0,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paymentState = ref.watch(paymentControllerProvider);
    final totalPayable = amount + tipAmount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Payment Method', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Amount Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primaryRed.withOpacity(0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primaryRed.withOpacity(0.2)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Amount Payable', style: TextStyle(fontSize: 12, color: AppColors.neutralGray)),
                      const SizedBox(height: 2),
                      Text(
                        restaurantName,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                  Text(
                    CurrencyFormatter.formatINR(totalPayable),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryRed,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'Recommended & Instant',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.neutralGray),
            ),
            const SizedBox(height: 10),

            // UPI Option
            PaymentOptionTile(
              method: PaymentMethod.upi,
              isSelected: paymentState.selectedMethod == PaymentMethod.upi,
              onSelect: () => ref.read(paymentControllerProvider.notifier).selectPaymentMethod(PaymentMethod.upi),
            ),

            // Cards Option
            PaymentOptionTile(
              method: PaymentMethod.card,
              isSelected: paymentState.selectedMethod == PaymentMethod.card,
              onSelect: () => ref.read(paymentControllerProvider.notifier).selectPaymentMethod(PaymentMethod.card),
            ),

            // FoodIQ Wallet Option
            PaymentOptionTile(
              method: PaymentMethod.wallet,
              isSelected: paymentState.selectedMethod == PaymentMethod.wallet,
              onSelect: () => ref.read(paymentControllerProvider.notifier).selectPaymentMethod(PaymentMethod.wallet),
            ),

            const SizedBox(height: 14),
            const Text(
              'Pay upon Arrival',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.neutralGray),
            ),
            const SizedBox(height: 10),

            // Cash on Delivery Option
            PaymentOptionTile(
              method: PaymentMethod.cod,
              isSelected: paymentState.selectedMethod == PaymentMethod.cod,
              onSelect: () => ref.read(paymentControllerProvider.notifier).selectPaymentMethod(PaymentMethod.cod),
            ),

            if (paymentState.errorMessage != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        paymentState.errorMessage!,
                        style: const TextStyle(color: Colors.red, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
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
          child: AppButton(
            text: 'Pay ${CurrencyFormatter.formatINR(totalPayable)} & Place Order',
            isLoading: paymentState.isLoading,
            onPressed: () async {
              final success = await ref
                  .read(paymentControllerProvider.notifier)
                  .executeCheckoutAndPayment(
                    restaurantId: restaurantId,
                    deliveryAddress: deliveryAddress,
                    amount: totalPayable,
                    walletDeduction: walletDeduction,
                    specialInstructions: instructions,
                    useCoins: useCoins,
                  );

              if (success && context.mounted) {
                final placedOrder = ref.read(paymentControllerProvider).placedOrder;
                final earnedCoins = ref.read(paymentControllerProvider).earnedCoins;
                final orderId = placedOrder?.id ?? 0;

                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (ctx) => ScratchCardDialog(
                    coinsEarned: earnedCoins,
                    onDismiss: () {
                      Navigator.pop(ctx);
                      context.go('/orders/$orderId');
                    },
                  ),
                );
              }
            },
          ),
        ),
      ),
    );
  }
}

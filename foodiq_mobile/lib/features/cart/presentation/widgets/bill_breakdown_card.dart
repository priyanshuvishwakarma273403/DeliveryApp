import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';

class BillBreakdownCard extends StatelessWidget {
  final double subtotal;
  final double packagingCharge;
  final double deliveryCharge;
  final double platformFee;
  final double taxes;
  final double discount;
  final double walletDeduction;
  final double finalAmount;

  const BillBreakdownCard({
    super.key,
    required this.subtotal,
    this.packagingCharge = 20.0,
    this.deliveryCharge = 40.0,
    this.platformFee = 5.0,
    required this.taxes,
    this.discount = 0.0,
    this.walletDeduction = 0.0,
    required this.finalAmount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Bill Summary',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),

          _buildRow('Item Total', subtotal),
          _buildRow('Restaurant Packaging', packagingCharge),
          _buildRow('Delivery Partner Fee', deliveryCharge),
          _buildRow('Platform Fee', platformFee),
          _buildRow('Government Taxes (GST 5%)', taxes),

          if (discount > 0)
            _buildRow('Coupon Discount', -discount, isDiscount: true),

          if (walletDeduction > 0)
            _buildRow('FoodIQ Coins Used', -walletDeduction, isDiscount: true),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Divider(),
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'To Pay',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              Text(
                CurrencyFormatter.formatINR(finalAmount),
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryRed,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, double amount, {bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: isDiscount ? AppColors.vegGreen : AppColors.neutralGray,
              fontWeight: isDiscount ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          Text(
            isDiscount
                ? '- ${CurrencyFormatter.formatINR(amount.abs())}'
                : CurrencyFormatter.formatINR(amount),
            style: TextStyle(
              fontSize: 13,
              color: isDiscount ? AppColors.vegGreen : null,
              fontWeight: isDiscount ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

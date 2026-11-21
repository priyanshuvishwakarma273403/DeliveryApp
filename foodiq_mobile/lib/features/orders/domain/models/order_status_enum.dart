import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';

enum OrderStatus {
  placed(0, 'Order Placed', 'We have received your order', Icons.check_circle_outline, AppColors.accentOrange),
  confirmed(1, 'Order Confirmed', 'Restaurant has accepted your order', Icons.receipt_long, AppColors.accentOrange),
  preparing(2, 'Food is Being Prepared', 'Chef is cooking your fresh meal', Icons.outdoor_grill_outlined, AppColors.accentOrange),
  outForDelivery(3, 'Out for Delivery', 'Rider is on the way to your door', Icons.delivery_dining, AppColors.accentOrange),
  delivered(4, 'Delivered', 'Delivered safely with care', Icons.task_alt, AppColors.vegGreen),
  cancelled(-1, 'Cancelled', 'Order was cancelled', Icons.cancel_outlined, AppColors.primaryRed);

  final int step;
  final String label;
  final String subtitle;
  final IconData icon;
  final Color color;

  const OrderStatus(this.step, this.label, this.subtitle, this.icon, this.color);

  static OrderStatus fromString(String? status) {
    final s = status?.toUpperCase() ?? '';
    switch (s) {
      case 'PLACED':
      case 'CREATED':
        return OrderStatus.placed;
      case 'CONFIRMED':
      case 'ACCEPTED':
        return OrderStatus.confirmed;
      case 'PREPARING':
      case 'COOKING':
        return OrderStatus.preparing;
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
      case 'ON_THE_WAY':
        return OrderStatus.outForDelivery;
      case 'DELIVERED':
      case 'COMPLETED':
        return OrderStatus.delivered;
      case 'CANCELLED':
      case 'REJECTED':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.placed;
    }
  }
}

import 'package:foodiq_mobile/features/payments/domain/models/payment_method_enum.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_transaction_model.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

abstract class PaymentRepository {
  Future<OrderModel> placeOrder({
    required String deliveryAddress,
    required PaymentMethod paymentMethod,
    String? specialInstructions,
    bool useCoins = false,
  });

  Future<PaymentTransactionModel> processPayment({
    required String orderId,
    required String customerId,
    required String restaurantId,
    required double amount,
    double walletDeduction = 0.0,
    required PaymentMethod paymentMethod,
    String gateway = 'RAZORPAY',
    String? idempotencyKey,
  });
}

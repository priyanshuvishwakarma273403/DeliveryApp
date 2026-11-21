import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/features/payments/data/datasources/payment_remote_datasource.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_method_enum.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_transaction_model.dart';
import 'package:foodiq_mobile/features/payments/domain/repositories/payment_repository.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

final paymentRemoteDataSourceProvider = Provider<PaymentRemoteDataSource>((ref) {
  return PaymentRemoteDataSourceImpl(ref.watch(apiClientProvider));
});

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepositoryImpl(ref.watch(paymentRemoteDataSourceProvider));
});

class PaymentRepositoryImpl implements PaymentRepository {
  final PaymentRemoteDataSource _remoteDataSource;

  PaymentRepositoryImpl(this._remoteDataSource);

  @override
  Future<OrderModel> placeOrder({
    required String deliveryAddress,
    required PaymentMethod paymentMethod,
    String? specialInstructions,
    bool useCoins = false,
  }) async {
    return await _remoteDataSource.placeOrder(
      deliveryAddress: deliveryAddress,
      paymentMethod: paymentMethod,
      specialInstructions: specialInstructions,
      useCoins: useCoins,
    );
  }

  @override
  Future<PaymentTransactionModel> processPayment({
    required String orderId,
    required String customerId,
    required String restaurantId,
    required double amount,
    double walletDeduction = 0.0,
    required PaymentMethod paymentMethod,
    String gateway = 'RAZORPAY',
    String? idempotencyKey,
  }) async {
    return await _remoteDataSource.processPayment(
      orderId: orderId,
      customerId: customerId,
      restaurantId: restaurantId,
      amount: amount,
      walletDeduction: walletDeduction,
      paymentMethod: paymentMethod,
      gateway: gateway,
      idempotencyKey: idempotencyKey,
    );
  }
}

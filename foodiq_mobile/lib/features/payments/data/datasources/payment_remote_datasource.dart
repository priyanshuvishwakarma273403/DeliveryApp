import 'package:dio/dio.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_method_enum.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_transaction_model.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';
import 'package:uuid/uuid.dart';

abstract class PaymentRemoteDataSource {
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

class PaymentRemoteDataSourceImpl implements PaymentRemoteDataSource {
  final ApiClient _apiClient;
  static const _uuid = Uuid();

  PaymentRemoteDataSourceImpl(this._apiClient);

  @override
  Future<OrderModel> placeOrder({
    required String deliveryAddress,
    required PaymentMethod paymentMethod,
    String? specialInstructions,
    bool useCoins = false,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.orders,
      data: {
        'deliveryAddress': deliveryAddress,
        'paymentMethod': paymentMethod.backendCode,
        'specialInstructions': specialInstructions,
        'useCoins': useCoins,
      },
    );

    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return OrderModel.fromJson(data);
    }
    throw Exception(responseData['message'] ?? 'Failed to place order');
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
    final key = idempotencyKey ?? _uuid.v4();

    final response = await _apiClient.post(
      ApiEndpoints.pay,
      options: Options(
        headers: {'Idempotency-Key': key},
      ),
      queryParameters: {
        'orderId': orderId,
        'customerId': customerId,
        'restaurantId': restaurantId,
        'amount': amount,
        'walletDeduction': walletDeduction,
        'paymentMethod': paymentMethod.backendCode,
        'gateway': gateway,
      },
    );

    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return PaymentTransactionModel.fromJson(data);
    }
    throw Exception(responseData['message'] ?? 'Payment failed');
  }
}

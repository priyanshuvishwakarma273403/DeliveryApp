import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/features/checkout/domain/models/checkout_pricing_model.dart';

abstract class CheckoutRemoteDataSource {
  Future<CheckoutPricingModel> getAuthoritativePricing({
    required double subtotal,
    double discount = 0.0,
    double coinsUsed = 0.0,
    int? userId,
  });

  Future<double> getUserWalletBalance(int userId);
}

class CheckoutRemoteDataSourceImpl implements CheckoutRemoteDataSource {
  final ApiClient _apiClient;

  CheckoutRemoteDataSourceImpl(this._apiClient);

  @override
  Future<CheckoutPricingModel> getAuthoritativePricing({
    required double subtotal,
    double discount = 0.0,
    double coinsUsed = 0.0,
    int? userId,
  }) async {
    final queryParams = <String, dynamic>{
      'subtotal': subtotal,
      'discount': discount,
      'coinsUsed': coinsUsed,
    };
    if (userId != null) {
      queryParams['userId'] = userId;
    }

    final response = await _apiClient.get(
      ApiEndpoints.checkoutPrice,
      queryParameters: queryParams,
    );

    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return CheckoutPricingModel.fromJson(data);
    }

    // Fallback calculation matching backend formula strictly
    final taxable = (subtotal - discount).clamp(0.0, double.infinity);
    final cgst = (taxable * 0.025 * 100.0).roundToDouble() / 100.0;
    final sgst = (taxable * 0.025 * 100.0).roundToDouble() / 100.0;
    const packaging = 20.0;
    const delivery = 40.0;
    const platform = 5.0;
    final finalAmt = (taxable + cgst + sgst + packaging + delivery + platform - coinsUsed).clamp(0.0, double.infinity);

    return CheckoutPricingModel(
      subtotal: subtotal,
      discount: discount,
      cgst: cgst,
      sgst: sgst,
      packagingCharge: packaging,
      deliveryCharge: delivery,
      platformFee: platform,
      walletDeduction: coinsUsed,
      finalAmount: finalAmt,
    );
  }

  @override
  Future<double> getUserWalletBalance(int userId) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.walletByUserId(userId));
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] != null) {
        final data = responseData['data'] as Map<String, dynamic>;
        return (data['balance'] is num) ? (data['balance'] as num).toDouble() : 0.0;
      }
    } catch (_) {}
    return 0.0;
  }
}

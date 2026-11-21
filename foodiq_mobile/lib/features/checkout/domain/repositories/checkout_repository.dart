import 'package:foodiq_mobile/features/checkout/domain/models/checkout_pricing_model.dart';

abstract class CheckoutRepository {
  Future<CheckoutPricingModel> getAuthoritativePricing({
    required double subtotal,
    double discount = 0.0,
    double coinsUsed = 0.0,
    int? userId,
  });

  Future<double> getUserWalletBalance(int userId);
}

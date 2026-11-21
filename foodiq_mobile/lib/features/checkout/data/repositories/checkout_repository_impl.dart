import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/features/checkout/data/datasources/checkout_remote_datasource.dart';
import 'package:foodiq_mobile/features/checkout/domain/models/checkout_pricing_model.dart';
import 'package:foodiq_mobile/features/checkout/domain/repositories/checkout_repository.dart';

final checkoutRemoteDataSourceProvider = Provider<CheckoutRemoteDataSource>((ref) {
  return CheckoutRemoteDataSourceImpl(ref.watch(apiClientProvider));
});

final checkoutRepositoryProvider = Provider<CheckoutRepository>((ref) {
  return CheckoutRepositoryImpl(ref.watch(checkoutRemoteDataSourceProvider));
});

class CheckoutRepositoryImpl implements CheckoutRepository {
  final CheckoutRemoteDataSource _remoteDataSource;

  CheckoutRepositoryImpl(this._remoteDataSource);

  @override
  Future<CheckoutPricingModel> getAuthoritativePricing({
    required double subtotal,
    double discount = 0.0,
    double coinsUsed = 0.0,
    int? userId,
  }) async {
    return await _remoteDataSource.getAuthoritativePricing(
      subtotal: subtotal,
      discount: discount,
      coinsUsed: coinsUsed,
      userId: userId,
    );
  }

  @override
  Future<double> getUserWalletBalance(int userId) async {
    return await _remoteDataSource.getUserWalletBalance(userId);
  }
}

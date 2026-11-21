import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/checkout/domain/models/checkout_pricing_model.dart';

void main() {
  group('CheckoutPricingModel Tests', () {
    test('should parse Spring Boot finance checkout response accurately', () {
      final json = {
        'subtotal': 600.0,
        'discount': 50.0,
        'cgst': 13.75,
        'sgst': 13.75,
        'packagingCharge': 20.0,
        'deliveryCharge': 40.0,
        'platformFee': 5.0,
        'walletDeduction': 30.0,
        'finalAmount': 612.5,
        'estimatedDeliveryTime': '25 - 35 mins',
      };

      final model = CheckoutPricingModel.fromJson(json);

      expect(model.subtotal, 600.0);
      expect(model.discount, 50.0);
      expect(model.cgst, 13.75);
      expect(model.sgst, 13.75);
      expect(model.totalTaxes, 27.5); // 13.75 + 13.75
      expect(model.packagingCharge, 20.0);
      expect(model.deliveryCharge, 40.0);
      expect(model.platformFee, 5.0);
      expect(model.walletDeduction, 30.0);
      expect(model.finalAmount, 612.5);
      expect(model.estimatedDeliveryTime, '25 - 35 mins');
    });

    test('should supply correct default fees if missing in JSON', () {
      final json = {
        'subtotal': 300.0,
        'cgst': 7.5,
        'sgst': 7.5,
        'finalAmount': 372.5,
      };

      final model = CheckoutPricingModel.fromJson(json);

      expect(model.packagingCharge, 20.0);
      expect(model.deliveryCharge, 40.0);
      expect(model.platformFee, 5.0);
      expect(model.discount, 0.0);
      expect(model.walletDeduction, 0.0);
      expect(model.totalTaxes, 15.0);
    });
  });
}

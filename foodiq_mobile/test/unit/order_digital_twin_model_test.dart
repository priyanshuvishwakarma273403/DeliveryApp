import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_digital_twin_model.dart';

void main() {
  group('OrderDigitalTwinModel Tests', () {
    test('should parse Spring Boot OrderDigitalTwin entity accurately', () {
      final json = {
        'orderId': 1050,
        'restaurantStatus': 'PREPARING',
        'kitchenProgress': 0.75,
        'predictedFoodReadyAt': '2026-11-21T15:10:00',
        'riderStatus': 'ARRIVED_AT_STORE',
        'predictedDeliveryAt': '2026-11-21T15:30:00',
        'slaRisk': 'LOW',
        'delayRisk': 'NONE',
        'overallHealth': 'HEALTHY',
      };

      final twin = OrderDigitalTwinModel.fromJson(json);

      expect(twin.orderId, 1050);
      expect(twin.restaurantStatus, 'PREPARING');
      expect(twin.kitchenProgress, 0.75);
      expect(twin.slaRisk, 'LOW');
      expect(twin.delayRisk, 'NONE');
      expect(twin.overallHealth, 'HEALTHY');
      expect(twin.isDelayed, false);
      expect(twin.isHealthy, true);
    });

    test('isDelayed should flag true when delayRisk is CRITICAL or HIGH', () {
      final delayedTwin = OrderDigitalTwinModel.fromJson({
        'orderId': 1051,
        'delayRisk': 'CRITICAL',
        'overallHealth': 'WARNING',
      });

      expect(delayedTwin.isDelayed, true);
      expect(delayedTwin.isHealthy, false);
    });
  });
}

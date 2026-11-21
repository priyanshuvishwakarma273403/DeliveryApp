import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/orders/domain/models/rider_location_model.dart';

void main() {
  group('RiderLocationModel Tests', () {
    test('should parse location WebSocket JSON accurately', () {
      final json = {
        'orderId': 2045,
        'latitude': 28.5355,
        'longitude': 77.3910,
        'speed': 28.5,
        'heading': 180.0,
        'timestamp': '2026-11-21T14:45:00',
      };

      final loc = RiderLocationModel.fromJson(json);

      expect(loc.orderId, 2045);
      expect(loc.latitude, 28.5355);
      expect(loc.longitude, 77.3910);
      expect(loc.speed, 28.5);
      expect(loc.heading, 180.0);
    });

    test('should provide sensible defaults when coordinates are null', () {
      final json = {'orderId': '101'};
      final loc = RiderLocationModel.fromJson(json);

      expect(loc.orderId, 101);
      expect(loc.latitude, 28.6139);
      expect(loc.longitude, 77.2090);
      expect(loc.speed, null);
    });
  });
}

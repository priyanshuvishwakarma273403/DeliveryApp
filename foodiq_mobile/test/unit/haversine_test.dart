import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/core/utils/haversine.dart';

void main() {
  group('Haversine Distance & ETA Calculation Tests', () {
    test('should calculate distance between two coordinates correctly', () {
      // Coordinates: Connaught Place to Noida Sector 62 (~17 km)
      final distance = HaversineCalculator.calculateDistanceKm(
        startLatitude: 28.6315,
        startLongitude: 77.2167,
        endLatitude: 28.6280,
        endLongitude: 77.3649,
      );

      expect(distance, greaterThan(13.0));
      expect(distance, lessThan(16.0));
    });

    test('should estimate delivery minutes including kitchen prep', () {
      // 5 km ride: prep 15 min + (5 * 3 = 15 min) = ~30 min
      final eta = HaversineCalculator.estimateDeliveryMinutes(5.0, prepMinutes: 15);
      expect(eta, 30);
    });
  });
}

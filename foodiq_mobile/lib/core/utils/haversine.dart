import 'dart:math';

class HaversineCalculator {
  static const double _earthRadiusKm = 6371.0;

  static double calculateDistanceKm({
    required double startLatitude,
    required double startLongitude,
    required double endLatitude,
    required double endLongitude,
  }) {
    final dLat = _degreesToRadians(endLatitude - startLatitude);
    final dLon = _degreesToRadians(endLongitude - startLongitude);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(startLatitude)) *
            cos(_degreesToRadians(endLatitude)) *
            sin(dLon / 2) *
            sin(dLon / 2);

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return _earthRadiusKm * c;
  }

  static double distanceKm(
    double startLatitude,
    double startLongitude,
    double endLatitude,
    double endLongitude,
  ) => calculateDistanceKm(
    startLatitude: startLatitude,
    startLongitude: startLongitude,
    endLatitude: endLatitude,
    endLongitude: endLongitude,
  );

  static int estimateDeliveryMinutes(double distanceKm, {int prepMinutes = 15}) {
    // Average urban two-wheeler speed: 20 km/h -> 3 mins per km
    final transitMinutes = (distanceKm * 3.0).ceil();
    return prepMinutes + transitMinutes;
  }

  static double _degreesToRadians(double degrees) {
    return degrees * pi / 180.0;
  }
}

typedef Haversine = HaversineCalculator;

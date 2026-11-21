import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/restaurants/domain/models/restaurant_filter.dart';

void main() {
  group('RestaurantFilter Tests', () {
    test('should convert filter to Spring Boot query parameters correctly', () {
      const filter = RestaurantFilter(
        minRating: 4.0,
        cuisine: 'North Indian',
        city: 'Delhi',
        searchQuery: 'Paneer',
        sortBy: RestaurantSortBy.rating,
      );

      final params = filter.toQueryParams();

      expect(params['minRating'], 4.0);
      expect(params['cuisine'], 'North Indian');
      expect(params['city'], 'Delhi');
      expect(params['search'], 'Paneer');
    });

    test('should exclude All cuisine and empty queries from parameters', () {
      const filter = RestaurantFilter(
        cuisine: 'All',
        searchQuery: '',
      );

      final params = filter.toQueryParams();

      expect(params.containsKey('cuisine'), false);
      expect(params.containsKey('search'), false);
    });

    test('should correctly map sort criteria to query strings', () {
      expect(RestaurantSortBy.relevance.toParamString(), 'relevance');
      expect(RestaurantSortBy.rating.toParamString(), 'rating');
      expect(RestaurantSortBy.deliveryTime.toParamString(), 'deliveryTime');
      expect(RestaurantSortBy.costLowToHigh.toParamString(), 'costAsc');
      expect(RestaurantSortBy.costHighToLow.toParamString(), 'costDesc');
    });

    test('should copyWith properly override criteria', () {
      const initial = RestaurantFilter(isVegOnly: false, minRating: 3.5);
      final updated = initial.copyWith(isVegOnly: true, minRating: 4.5);

      expect(updated.isVegOnly, true);
      expect(updated.minRating, 4.5);
    });
  });
}

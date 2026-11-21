import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/restaurants/data/repositories/restaurant_repository_impl.dart';
import 'package:foodiq_mobile/features/restaurants/domain/models/restaurant_filter.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';

final restaurantFilterProvider = StateProvider<RestaurantFilter>((ref) {
  return const RestaurantFilter();
});

final restaurantListProvider = FutureProvider<List<RestaurantModel>>((ref) async {
  final repository = ref.watch(restaurantRepositoryProvider);
  final filter = ref.watch(restaurantFilterProvider);
  return await repository.getRestaurants(filter: filter);
});

final topRatedRestaurantsProvider = FutureProvider<List<RestaurantModel>>((ref) async {
  final repository = ref.watch(restaurantRepositoryProvider);
  final list = await repository.getRestaurants(
    filter: const RestaurantFilter(minRating: 4.0),
    size: 10,
  );
  list.sort((a, b) => b.rating.compareTo(a.rating));
  return list;
});

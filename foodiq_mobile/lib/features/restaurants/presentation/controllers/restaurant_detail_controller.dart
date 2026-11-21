import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/restaurants/data/repositories/restaurant_repository_impl.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';

final restaurantDetailProvider =
    FutureProvider.family<RestaurantModel, String>((ref, id) async {
  final repository = ref.watch(restaurantRepositoryProvider);
  return await repository.getRestaurantById(id);
});

final restaurantMenuProvider =
    FutureProvider.family<List<MenuItemModel>, String>((ref, id) async {
  final repository = ref.watch(restaurantRepositoryProvider);
  return await repository.getMenuItemsByRestaurant(id);
});

// Selected menu category filter
final selectedMenuCategoryProvider = StateProvider.autoDispose<String>((ref) {
  return 'All';
});

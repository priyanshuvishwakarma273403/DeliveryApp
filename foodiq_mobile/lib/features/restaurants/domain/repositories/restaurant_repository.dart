import 'package:foodiq_mobile/features/restaurants/domain/models/restaurant_filter.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';

abstract class RestaurantRepository {
  Future<List<RestaurantModel>> getRestaurants({
    RestaurantFilter? filter,
    int page = 0,
    int size = 20,
  });

  Future<RestaurantModel> getRestaurantById(String id);

  Future<List<MenuItemModel>> getMenuItemsByRestaurant(String restaurantId);
}

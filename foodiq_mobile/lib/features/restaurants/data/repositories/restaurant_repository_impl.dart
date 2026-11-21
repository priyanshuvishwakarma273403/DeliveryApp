import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/features/restaurants/data/datasources/restaurant_remote_datasource.dart';
import 'package:foodiq_mobile/features/restaurants/domain/models/restaurant_filter.dart';
import 'package:foodiq_mobile/features/restaurants/domain/repositories/restaurant_repository.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';

final restaurantRepositoryProvider = Provider<RestaurantRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final remoteDataSource = RestaurantRemoteDataSource(apiClient);
  return RestaurantRepositoryImpl(remoteDataSource);
});

class RestaurantRepositoryImpl implements RestaurantRepository {
  final RestaurantRemoteDataSource _remoteDataSource;

  RestaurantRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<RestaurantModel>> getRestaurants({
    RestaurantFilter? filter,
    int page = 0,
    int size = 20,
  }) async {
    return await _remoteDataSource.getRestaurants(
      filter: filter,
      page: page,
      size: size,
    );
  }

  @override
  Future<RestaurantModel> getRestaurantById(String id) async {
    return await _remoteDataSource.getRestaurantById(id);
  }

  @override
  Future<List<MenuItemModel>> getMenuItemsByRestaurant(String restaurantId) async {
    return await _remoteDataSource.getMenuItemsByRestaurant(restaurantId);
  }
}

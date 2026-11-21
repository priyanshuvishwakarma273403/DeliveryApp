import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/core/api/api_response.dart';
import 'package:foodiq_mobile/core/errors/app_exception.dart';
import 'package:foodiq_mobile/features/restaurants/domain/models/restaurant_filter.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';

class RestaurantRemoteDataSource {
  final ApiClient _apiClient;

  RestaurantRemoteDataSource(this._apiClient);

  Future<List<RestaurantModel>> getRestaurants({
    RestaurantFilter? filter,
    int page = 0,
    int size = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'size': size,
        ...?filter?.toQueryParams(),
      };

      final response = await _apiClient.get(
        ApiEndpoints.restaurants,
        queryParameters: queryParams,
      );

      final data = response.data;
      if (data is Map<String, dynamic>) {
        final apiResponse = ApiResponse.fromJson(data, (json) {
          if (json is List) {
            return json.map((item) => RestaurantModel.fromJson(item as Map<String, dynamic>)).toList();
          } else if (json is Map<String, dynamic> && json.containsKey('content')) {
            // Paginated response
            final content = json['content'] as List<dynamic>;
            return content.map((item) => RestaurantModel.fromJson(item as Map<String, dynamic>)).toList();
          }
          return <RestaurantModel>[];
        });

        if (apiResponse.data != null) {
          return apiResponse.data!;
        }
      } else if (data is List) {
        return data.map((item) => RestaurantModel.fromJson(item as Map<String, dynamic>)).toList();
      }

      return [];
    } catch (e) {
      throw ServerException(message: 'Failed to load restaurants: $e');
    }
  }

  Future<RestaurantModel> getRestaurantById(String id) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.restaurantById(id));
      final apiResponse = ApiResponse.fromJson(
        response.data as Map<String, dynamic>,
        (json) => RestaurantModel.fromJson(json as Map<String, dynamic>),
      );

      if (apiResponse.data == null) {
        throw NotFoundException(message: 'Restaurant profile not found');
      }

      return apiResponse.data!;
    } catch (e) {
      throw ServerException(message: 'Could not fetch restaurant details: $e');
    }
  }

  Future<List<MenuItemModel>> getMenuItemsByRestaurant(String restaurantId) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.menuByRestaurant(restaurantId));
      final data = response.data;

      if (data is Map<String, dynamic>) {
        final apiResponse = ApiResponse.fromJson(data, (json) {
          if (json is List) {
            return json.map((item) => MenuItemModel.fromJson(item as Map<String, dynamic>)).toList();
          }
          return <MenuItemModel>[];
        });
        return apiResponse.data ?? [];
      } else if (data is List) {
        return data.map((item) => MenuItemModel.fromJson(item as Map<String, dynamic>)).toList();
      }

      return [];
    } catch (e) {
      throw ServerException(message: 'Failed to load menu: $e');
    }
  }
}

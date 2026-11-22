import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

final restaurantOpsRepositoryProvider = Provider<RestaurantOpsRepository>((ref) {
  return RestaurantOpsRepository(ref.watch(apiClientProvider));
});

class RestaurantOpsRepository {
  final ApiClient _apiClient;

  RestaurantOpsRepository(this._apiClient);

  Future<List<OrderModel>> getRestaurantOrders(String restaurantId) async {
    try {
      final response = await _apiClient.get('/orders/restaurant/$restaurantId');
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] is List) {
        final list = responseData['data'] as List<dynamic>;
        return list.map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    await _apiClient.patch(
      '/orders/$orderId/status',
      queryParameters: {'status': status},
    );
  }

  Future<void> markFoodReady(String restaurantId, int orderId) async {
    await _apiClient.post('/v1/kitchen/$restaurantId/orders/$orderId/ready');
  }
}

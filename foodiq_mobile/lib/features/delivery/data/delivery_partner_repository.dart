import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/core/websocket/stomp_service.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

final deliveryPartnerRepositoryProvider = Provider<DeliveryPartnerRepository>((ref) {
  return DeliveryPartnerRepository(
    apiClient: ref.watch(apiClientProvider),
    stompService: ref.watch(stompServiceProvider),
  );
});

class DeliveryPartnerRepository {
  final ApiClient _apiClient;
  final StompService _stompService;

  DeliveryPartnerRepository({
    required ApiClient apiClient,
    required StompService stompService,
  })  : _apiClient = apiClient,
        _stompService = stompService;

  Future<List<OrderModel>> getAvailableOrders() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.availableDeliveries);
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] is List) {
        final list = responseData['data'] as List<dynamic>;
        return list.map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  Future<void> acceptOrder(int orderId) async {
    await _apiClient.post(ApiEndpoints.acceptOrder(orderId));
  }

  Future<void> pickupOrder(int orderId) async {
    await _apiClient.post(ApiEndpoints.pickupOrder(orderId));
  }

  Future<void> deliverOrder(int orderId) async {
    await _apiClient.post(ApiEndpoints.deliverOrder(orderId));
  }

  Future<void> updateRiderLocation(int orderId, double lat, double lon) async {
    // 1. Send over WebSocket for real-time customer map update
    _stompService.send('/app/location/$orderId', {
      'latitude': lat,
      'longitude': lon,
    });

    // 2. REST fallback
    try {
      await _apiClient.post(
        ApiEndpoints.updateRiderLocation(orderId),
        data: {'latitude': lat, 'longitude': lon},
      );
    } catch (_) {}
  }

  Future<List<OrderModel>> getMyDeliveries() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.deliveryPartnerProfile);
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] is List) {
        final list = responseData['data'] as List<dynamic>;
        return list.map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }
}

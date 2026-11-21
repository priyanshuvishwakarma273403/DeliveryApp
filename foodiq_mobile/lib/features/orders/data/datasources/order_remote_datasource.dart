import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/core/websocket/stomp_service.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_digital_twin_model.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_timeline_model.dart';
import 'package:foodiq_mobile/features/orders/domain/models/rider_location_model.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

abstract class OrderRemoteDataSource {
  Future<List<OrderModel>> getMyOrders();
  Future<OrderModel> getOrderById(int orderId);
  Future<OrderModel> cancelOrder(int orderId, String reason);
  Future<OrderDigitalTwinModel> getOrderDigitalTwin(int orderId);
  Future<List<OrderTimelineModel>> getOrderTimeline(int orderId);

  void subscribeToOrder(int orderId, void Function(Map<String, dynamic>) onMessage);
  void subscribeToRiderLocation(int orderId, void Function(Map<String, dynamic>) onMessage);
  void unsubscribe(int orderId);
}

class OrderRemoteDataSourceImpl implements OrderRemoteDataSource {
  final ApiClient _apiClient;
  final StompService _stompService;

  OrderRemoteDataSourceImpl({
    required ApiClient apiClient,
    required StompService stompService,
  })  : _apiClient = apiClient,
        _stompService = stompService;

  @override
  Future<List<OrderModel>> getMyOrders() async {
    final response = await _apiClient.get(ApiEndpoints.myOrders);
    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] is List) {
      final list = responseData['data'] as List<dynamic>;
      return list
          .map((item) => OrderModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  @override
  Future<OrderModel> getOrderById(int orderId) async {
    final response = await _apiClient.get(ApiEndpoints.orderById(orderId));
    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return OrderModel.fromJson(data);
    }
    throw Exception('Order not found');
  }

  @override
  Future<OrderModel> cancelOrder(int orderId, String reason) async {
    final response = await _apiClient.delete(ApiEndpoints.cancelOrder(orderId));
    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return OrderModel.fromJson(data);
    }
    throw Exception('Failed to cancel order');
  }

  @override
  Future<OrderDigitalTwinModel> getOrderDigitalTwin(int orderId) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.orderTwin(orderId));
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] != null) {
        final data = responseData['data'] as Map<String, dynamic>;
        return OrderDigitalTwinModel.fromJson(data);
      }
    } catch (_) {}
    return OrderDigitalTwinModel(orderId: orderId);
  }

  @override
  Future<List<OrderTimelineModel>> getOrderTimeline(int orderId) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.orderTimeline(orderId));
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] is List) {
        final list = responseData['data'] as List<dynamic>;
        return list
            .map((item) => OrderTimelineModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  @override
  void subscribeToOrder(int orderId, void Function(Map<String, dynamic>) onMessage) {
    _stompService.subscribe('/topic/order/$orderId', onMessage);
  }

  @override
  void subscribeToRiderLocation(int orderId, void Function(Map<String, dynamic>) onMessage) {
    _stompService.subscribe('/topic/location/$orderId', onMessage);
  }

  @override
  void unsubscribe(int orderId) {
    _stompService.unsubscribe('/topic/order/$orderId');
    _stompService.unsubscribe('/topic/location/$orderId');
  }
}

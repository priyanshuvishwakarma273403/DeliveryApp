import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/websocket/stomp_service.dart';
import 'package:foodiq_mobile/features/orders/data/datasources/order_remote_datasource.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_digital_twin_model.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_timeline_model.dart';
import 'package:foodiq_mobile/features/orders/domain/models/rider_location_model.dart';
import 'package:foodiq_mobile/features/orders/domain/repositories/order_repository.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

final orderRemoteDataSourceProvider = Provider<OrderRemoteDataSource>((ref) {
  return OrderRemoteDataSourceImpl(
    apiClient: ref.watch(apiClientProvider),
    stompService: ref.watch(stompServiceProvider),
  );
});

final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  return OrderRepositoryImpl(ref.watch(orderRemoteDataSourceProvider));
});

class OrderRepositoryImpl implements OrderRepository {
  final OrderRemoteDataSource _remoteDataSource;

  OrderRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<OrderModel>> getMyOrders() async {
    return await _remoteDataSource.getMyOrders();
  }

  @override
  Future<OrderModel> getOrderById(int orderId) async {
    return await _remoteDataSource.getOrderById(orderId);
  }

  @override
  Future<OrderModel> cancelOrder(int orderId, String reason) async {
    return await _remoteDataSource.cancelOrder(orderId, reason);
  }

  @override
  Future<OrderDigitalTwinModel> getOrderDigitalTwin(int orderId) async {
    return await _remoteDataSource.getOrderDigitalTwin(orderId);
  }

  @override
  Future<List<OrderTimelineModel>> getOrderTimeline(int orderId) async {
    return await _remoteDataSource.getOrderTimeline(orderId);
  }

  @override
  void subscribeToOrderUpdates(int orderId, void Function(OrderModel) onUpdate) {
    _remoteDataSource.subscribeToOrder(orderId, (data) {
      try {
        final order = OrderModel.fromJson(data);
        onUpdate(order);
      } catch (_) {}
    });
  }

  @override
  void subscribeToRiderLocation(int orderId, void Function(RiderLocationModel) onLocation) {
    _remoteDataSource.subscribeToRiderLocation(orderId, (data) {
      try {
        final loc = RiderLocationModel.fromJson(data);
        onLocation(loc);
      } catch (_) {}
    });
  }

  @override
  void unsubscribeFromOrder(int orderId) {
    _remoteDataSource.unsubscribe(orderId);
  }
}

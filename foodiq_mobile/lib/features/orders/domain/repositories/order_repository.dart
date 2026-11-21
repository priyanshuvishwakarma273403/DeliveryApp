import 'package:foodiq_mobile/features/orders/domain/models/order_digital_twin_model.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_timeline_model.dart';
import 'package:foodiq_mobile/features/orders/domain/models/rider_location_model.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

abstract class OrderRepository {
  Future<List<OrderModel>> getMyOrders();
  Future<OrderModel> getOrderById(int orderId);
  Future<OrderModel> cancelOrder(int orderId, String reason);
  Future<OrderDigitalTwinModel> getOrderDigitalTwin(int orderId);
  Future<List<OrderTimelineModel>> getOrderTimeline(int orderId);

  void subscribeToOrderUpdates(int orderId, void Function(OrderModel) onUpdate);
  void subscribeToRiderLocation(int orderId, void Function(RiderLocationModel) onLocation);
  void unsubscribeFromOrder(int orderId);
}

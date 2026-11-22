import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/restaurant/presentation/controllers/kds_controller.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

void main() {
  group('KdsState Filtering Tests', () {
    final orderNew = OrderModel(
      id: 1,
      customerId: 10,
      customerName: 'Rahul',
      restaurantId: 'rest_01',
      restaurantName: 'Pizza Hut',
      status: 'PLACED',
      totalAmount: 400.0,
      finalAmount: 400.0,
      deliveryAddress: 'Noida',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
    );

    final orderCooking = OrderModel(
      id: 2,
      customerId: 11,
      customerName: 'Pooja',
      restaurantId: 'rest_01',
      restaurantName: 'Pizza Hut',
      status: 'PREPARING',
      totalAmount: 600.0,
      finalAmount: 600.0,
      deliveryAddress: 'Noida',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
    );

    final orderReady = OrderModel(
      id: 3,
      customerId: 12,
      customerName: 'Rohit',
      restaurantId: 'rest_01',
      restaurantName: 'Pizza Hut',
      status: 'FOOD_READY',
      totalAmount: 250.0,
      finalAmount: 250.0,
      deliveryAddress: 'Noida',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
    );

    test('should filter orders accurately by activeTab stage', () {
      final allOrders = [orderNew, orderCooking, orderReady];

      final stateNew = KdsState(activeTab: 'NEW', orders: allOrders);
      expect(stateNew.filteredOrders.length, 1);
      expect(stateNew.filteredOrders.first.id, 1);

      final stateCooking = KdsState(activeTab: 'COOKING', orders: allOrders);
      expect(stateCooking.filteredOrders.length, 1);
      expect(stateCooking.filteredOrders.first.id, 2);

      final stateReady = KdsState(activeTab: 'READY', orders: allOrders);
      expect(stateReady.filteredOrders.length, 1);
      expect(stateReady.filteredOrders.first.id, 3);
    });
  });
}

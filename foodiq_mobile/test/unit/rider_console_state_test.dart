import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/delivery/presentation/controllers/rider_console_controller.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

void main() {
  group('RiderConsoleState Tests', () {
    test('initial state should be offline with empty runs', () {
      const state = RiderConsoleState();

      expect(state.isOnline, false);
      expect(state.isLoading, false);
      expect(state.availableOrders.isEmpty, true);
      expect(state.activeRun, null);
    });

    test('copyWith should update active run and available orders immutably', () {
      final order = OrderModel(
        id: 991,
        customerId: 12,
        customerName: 'Aman',
        restaurantId: 'r1',
        restaurantName: 'Subway',
        status: 'PLACED',
        totalAmount: 300.0,
        finalAmount: 300.0,
        deliveryAddress: 'Cyber City',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
      );

      const state = RiderConsoleState(isOnline: true);
      final updated = state.copyWith(activeRun: order);

      expect(updated.isOnline, true);
      expect(updated.activeRun?.id, 991);
      expect(updated.activeRun?.restaurantName, 'Subway');
    });
  });
}

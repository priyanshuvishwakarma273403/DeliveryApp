import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_status_enum.dart';

void main() {
  group('OrderStatus Enum Tests', () {
    test('should map all backend status strings to appropriate enum stages', () {
      expect(OrderStatus.fromString('PLACED'), OrderStatus.placed);
      expect(OrderStatus.fromString('CREATED'), OrderStatus.placed);

      expect(OrderStatus.fromString('CONFIRMED'), OrderStatus.confirmed);
      expect(OrderStatus.fromString('ACCEPTED'), OrderStatus.confirmed);

      expect(OrderStatus.fromString('PREPARING'), OrderStatus.preparing);
      expect(OrderStatus.fromString('COOKING'), OrderStatus.preparing);

      expect(OrderStatus.fromString('OUT_FOR_DELIVERY'), OrderStatus.outForDelivery);
      expect(OrderStatus.fromString('PICKED_UP'), OrderStatus.outForDelivery);
      expect(OrderStatus.fromString('ON_THE_WAY'), OrderStatus.outForDelivery);

      expect(OrderStatus.fromString('DELIVERED'), OrderStatus.delivered);
      expect(OrderStatus.fromString('COMPLETED'), OrderStatus.delivered);

      expect(OrderStatus.fromString('CANCELLED'), OrderStatus.cancelled);
      expect(OrderStatus.fromString('REJECTED'), OrderStatus.cancelled);
    });

    test('should verify sequential progression steps', () {
      expect(OrderStatus.placed.step < OrderStatus.confirmed.step, true);
      expect(OrderStatus.confirmed.step < OrderStatus.preparing.step, true);
      expect(OrderStatus.preparing.step < OrderStatus.outForDelivery.step, true);
      expect(OrderStatus.outForDelivery.step < OrderStatus.delivered.step, true);
    });
  });
}

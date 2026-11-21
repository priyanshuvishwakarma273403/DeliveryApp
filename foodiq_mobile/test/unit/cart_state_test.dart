import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/cart/domain/models/cart_state.dart';
import 'package:foodiq_mobile/shared/models/cart_item_model.dart';

void main() {
  group('CartState & CartItemModel Tests', () {
    test('should calculate subtotal, total items and empty states accurately', () {
      const item1 = CartItemModel(
        menuItemId: 'm1',
        name: 'Dal Makhani',
        price: 250.0,
        quantity: 2,
        isVeg: true,
      );

      const item2 = CartItemModel(
        menuItemId: 'm2',
        name: 'Butter Naan',
        price: 50.0,
        quantity: 4,
        isVeg: true,
      );

      final state = CartState(
        restaurantId: 'rest_01',
        restaurantName: 'Punjab Grill',
        items: [item1, item2],
      );

      expect(state.isEmpty, false);
      expect(state.isNotEmpty, true);
      expect(state.totalItems, 6); // 2 + 4
      expect(state.subtotal, 700.0); // (250*2) + (50*4)
      expect(state.getItemQuantity('m1'), 2);
      expect(state.getItemQuantity('m2'), 4);
      expect(state.getItemQuantity('non_existent'), 0);
    });

    test('should correctly round-trip CartState to/from JSON', () {
      final json = {
        'restaurantId': 'rest_99',
        'restaurantName': 'Bikanervala',
        'items': [
          {
            'menuItemId': 'sweet_1',
            'name': 'Gulab Jamun (2 pcs)',
            'price': 80.0,
            'quantity': 3,
            'isVeg': true,
          }
        ],
      };

      final state = CartState.fromJson(json);

      expect(state.restaurantId, 'rest_99');
      expect(state.restaurantName, 'Bikanervala');
      expect(state.items.length, 1);
      expect(state.items.first.name, 'Gulab Jamun (2 pcs)');
      expect(state.subtotal, 240.0);

      final serialized = state.toJson();
      expect(serialized['restaurantId'], 'rest_99');
      expect((serialized['items'] as List).length, 1);
    });

    test('copyWith should update fields immutably', () {
      const initial = CartState(
        restaurantId: 'r1',
        restaurantName: 'Subway',
      );

      final updated = initial.copyWith(
        restaurantName: 'Subway Green Park',
        syncStatus: CartSyncStatus.syncing,
      );

      expect(updated.restaurantId, 'r1');
      expect(updated.restaurantName, 'Subway Green Park');
      expect(updated.syncStatus, CartSyncStatus.syncing);
    });
  });
}

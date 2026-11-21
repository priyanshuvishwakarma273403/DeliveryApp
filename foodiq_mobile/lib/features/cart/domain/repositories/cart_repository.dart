import 'package:foodiq_mobile/shared/models/cart_item_model.dart';
import 'package:foodiq_mobile/features/cart/domain/models/cart_state.dart';
import 'package:foodiq_mobile/features/cart/domain/models/smart_combo_model.dart';

abstract class CartRepository {
  Future<CartState> getCart();
  Future<CartState> addItem({
    required String restaurantId,
    required String restaurantName,
    required CartItemModel item,
  });
  Future<CartState> updateQuantity({
    required String menuItemId,
    required int quantity,
  });
  Future<CartState> removeItem(String menuItemId);
  Future<void> clearCart();
  Future<List<SmartComboModel>> getSmartCombos(List<String> cartItemIds);
}

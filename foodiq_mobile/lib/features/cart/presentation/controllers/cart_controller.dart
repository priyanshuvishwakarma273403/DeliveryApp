import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/cart/data/repositories/cart_repository_impl.dart';
import 'package:foodiq_mobile/features/cart/domain/models/cart_state.dart';
import 'package:foodiq_mobile/features/cart/domain/models/smart_combo_model.dart';
import 'package:foodiq_mobile/features/cart/domain/repositories/cart_repository.dart';
import 'package:foodiq_mobile/shared/models/cart_item_model.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';

final cartControllerProvider = StateNotifierProvider<CartController, CartState>((ref) {
  final repository = ref.watch(cartRepositoryProvider);
  return CartController(repository);
});

final smartCombosProvider = FutureProvider<List<SmartComboModel>>((ref) async {
  final cart = ref.watch(cartControllerProvider);
  if (cart.isEmpty) return [];

  final itemIds = cart.items.map((i) => i.menuItemId).toList();
  final repository = ref.watch(cartRepositoryProvider);
  return repository.getSmartCombos(itemIds);
});

class CartController extends StateNotifier<CartState> {
  final CartRepository _repository;

  CartController(this._repository) : super(const CartState()) {
    loadCart();
  }

  Future<void> loadCart() async {
    state = state.copyWith(syncStatus: CartSyncStatus.syncing);
    try {
      final cart = await _repository.getCart();
      state = cart.copyWith(syncStatus: CartSyncStatus.idle);
    } catch (e) {
      state = state.copyWith(
        syncStatus: CartSyncStatus.error,
        errorMessage: e.toString(),
      );
    }
  }

  /// Returns true if item is from a different restaurant, indicating confirmation is needed.
  bool isDifferentRestaurant(String newRestaurantId) {
    return state.isNotEmpty &&
        state.restaurantId != null &&
        state.restaurantId != newRestaurantId;
  }

  Future<void> addItem({
    required MenuItemModel menuItem,
    required String restaurantId,
    required String restaurantName,
    bool forceReplace = false,
  }) async {
    if (isDifferentRestaurant(restaurantId) && !forceReplace) {
      return;
    }

    if (forceReplace) {
      await clearCart();
    }

    final cartItem = CartItemModel(
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      imageUrl: menuItem.imageUrl,
      quantity: 1,
      isVeg: menuItem.isVeg,
    );

    // Optimistic UI update
    final existing = state.getItem(menuItem.id);
    final updatedList = List<CartItemModel>.from(state.items);
    if (existing != null) {
      final idx = updatedList.indexWhere((i) => i.menuItemId == menuItem.id);
      updatedList[idx] = CartItemModel(
        menuItemId: existing.menuItemId,
        name: existing.name,
        price: existing.price,
        imageUrl: existing.imageUrl,
        quantity: existing.quantity + 1,
        isVeg: existing.isVeg,
      );
    } else {
      updatedList.add(cartItem);
    }

    state = state.copyWith(
      restaurantId: restaurantId,
      restaurantName: restaurantName,
      items: updatedList,
      syncStatus: CartSyncStatus.syncing,
    );

    try {
      final result = await _repository.addItem(
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        item: cartItem,
      );
      state = result.copyWith(syncStatus: CartSyncStatus.idle);
    } catch (e) {
      state = state.copyWith(
        syncStatus: CartSyncStatus.error,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> updateQuantity(String menuItemId, int quantity) async {
    // Optimistic update
    final updatedList = List<CartItemModel>.from(state.items);
    final idx = updatedList.indexWhere((i) => i.menuItemId == menuItemId);
    if (idx >= 0) {
      if (quantity <= 0) {
        updatedList.removeAt(idx);
      } else {
        final existing = updatedList[idx];
        updatedList[idx] = CartItemModel(
          menuItemId: existing.menuItemId,
          name: existing.name,
          price: existing.price,
          imageUrl: existing.imageUrl,
          quantity: quantity,
          isVeg: existing.isVeg,
        );
      }
    }

    state = state.copyWith(
      items: updatedList,
      restaurantId: updatedList.isEmpty ? null : state.restaurantId,
      restaurantName: updatedList.isEmpty ? null : state.restaurantName,
      syncStatus: CartSyncStatus.syncing,
    );

    try {
      final result = await _repository.updateQuantity(
        menuItemId: menuItemId,
        quantity: quantity,
      );
      state = result.copyWith(syncStatus: CartSyncStatus.idle);
    } catch (e) {
      state = state.copyWith(
        syncStatus: CartSyncStatus.error,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> removeItem(String menuItemId) async {
    await updateQuantity(menuItemId, 0);
  }

  Future<void> clearCart() async {
    state = const CartState();
    try {
      await _repository.clearCart();
    } catch (_) {}
  }
}

import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/storage/local_storage_service.dart';
import 'package:foodiq_mobile/features/cart/data/datasources/cart_remote_datasource.dart';
import 'package:foodiq_mobile/features/cart/domain/models/cart_state.dart';
import 'package:foodiq_mobile/features/cart/domain/models/smart_combo_model.dart';
import 'package:foodiq_mobile/features/cart/domain/repositories/cart_repository.dart';
import 'package:foodiq_mobile/shared/models/cart_item_model.dart';

final cartRemoteDataSourceProvider = Provider<CartRemoteDataSource>((ref) {
  return CartRemoteDataSourceImpl(ref.watch(apiClientProvider));
});

final cartRepositoryProvider = Provider<CartRepository>((ref) {
  return CartRepositoryImpl(
    remoteDataSource: ref.watch(cartRemoteDataSourceProvider),
    localStorage: ref.watch(localStorageProvider),
  );
});

class CartRepositoryImpl implements CartRepository {
  final CartRemoteDataSource _remoteDataSource;
  final LocalStorageService _localStorage;
  static const String _cachedCartKey = 'foodiq_cached_cart';

  CartRepositoryImpl({
    required CartRemoteDataSource remoteDataSource,
    required LocalStorageService localStorage,
  })  : _remoteDataSource = remoteDataSource,
        _localStorage = localStorage;

  @override
  Future<CartState> getCart() async {
    try {
      final remoteCart = await _remoteDataSource.getCart();
      await _cacheCart(remoteCart);
      return remoteCart;
    } catch (e) {
      // Fallback to locally cached cart if offline
      return _getCachedCart();
    }
  }

  @override
  Future<CartState> addItem({
    required String restaurantId,
    required String restaurantName,
    required CartItemModel item,
  }) async {
    try {
      final serverCart = await _remoteDataSource.addItem(item.menuItemId, item.quantity);
      // Ensure restaurant info is preserved if server returns null
      final updatedCart = serverCart.copyWith(
        restaurantId: serverCart.restaurantId ?? restaurantId,
        restaurantName: serverCart.restaurantName ?? restaurantName,
      );
      await _cacheCart(updatedCart);
      return updatedCart;
    } catch (e) {
      // Optimistic update locally
      final current = _getCachedCart();
      final updatedItems = List<CartItemModel>.from(current.items);
      final index = updatedItems.indexWhere((i) => i.menuItemId == item.menuItemId);
      if (index >= 0) {
        final existing = updatedItems[index];
        updatedItems[index] = CartItemModel(
          menuItemId: existing.menuItemId,
          name: existing.name,
          price: existing.price,
          imageUrl: existing.imageUrl,
          quantity: existing.quantity + item.quantity,
          isVeg: existing.isVeg,
        );
      } else {
        updatedItems.add(item);
      }
      final localCart = CartState(
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        items: updatedItems,
      );
      await _cacheCart(localCart);
      return localCart;
    }
  }

  @override
  Future<CartState> updateQuantity({
    required String menuItemId,
    required int quantity,
  }) async {
    try {
      if (quantity <= 0) {
        return await removeItem(menuItemId);
      }
      final serverCart = await _remoteDataSource.updateQuantity(menuItemId, quantity);
      await _cacheCart(serverCart);
      return serverCart;
    } catch (e) {
      final current = _getCachedCart();
      final updatedItems = List<CartItemModel>.from(current.items);
      final index = updatedItems.indexWhere((i) => i.menuItemId == menuItemId);
      if (index >= 0) {
        if (quantity <= 0) {
          updatedItems.removeAt(index);
        } else {
          final existing = updatedItems[index];
          updatedItems[index] = CartItemModel(
            menuItemId: existing.menuItemId,
            name: existing.name,
            price: existing.price,
            imageUrl: existing.imageUrl,
            quantity: quantity,
            isVeg: existing.isVeg,
          );
        }
      }
      final localCart = current.copyWith(
        items: updatedItems,
        restaurantId: updatedItems.isEmpty ? null : current.restaurantId,
        restaurantName: updatedItems.isEmpty ? null : current.restaurantName,
      );
      await _cacheCart(localCart);
      return localCart;
    }
  }

  @override
  Future<CartState> removeItem(String menuItemId) async {
    try {
      final serverCart = await _remoteDataSource.removeItem(menuItemId);
      await _cacheCart(serverCart);
      return serverCart;
    } catch (e) {
      final current = _getCachedCart();
      final updatedItems = current.items.where((i) => i.menuItemId != menuItemId).toList();
      final localCart = current.copyWith(
        items: updatedItems,
        restaurantId: updatedItems.isEmpty ? null : current.restaurantId,
        restaurantName: updatedItems.isEmpty ? null : current.restaurantName,
      );
      await _cacheCart(localCart);
      return localCart;
    }
  }

  @override
  Future<void> clearCart() async {
    try {
      await _remoteDataSource.clearCart();
    } catch (_) {}
    await _localStorage.remove(_cachedCartKey);
  }

  @override
  Future<List<SmartComboModel>> getSmartCombos(List<String> cartItemIds) async {
    return await _remoteDataSource.getSmartCombos(cartItemIds);
  }

  CartState _getCachedCart() {
    final raw = _localStorage.getString(_cachedCartKey);
    if (raw == null || raw.isEmpty) return const CartState();
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return CartState.fromJson(json);
    } catch (_) {
      return const CartState();
    }
  }

  Future<void> _cacheCart(CartState cart) async {
    if (cart.isEmpty) {
      await _localStorage.remove(_cachedCartKey);
    } else {
      await _localStorage.setString(_cachedCartKey, jsonEncode(cart.toJson()));
    }
  }
}

import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/features/cart/domain/models/smart_combo_model.dart';
import 'package:foodiq_mobile/features/cart/domain/models/cart_state.dart';

abstract class CartRemoteDataSource {
  Future<CartState> getCart();
  Future<CartState> addItem(String menuItemId, int quantity);
  Future<CartState> updateQuantity(String menuItemId, int quantity);
  Future<CartState> removeItem(String menuItemId);
  Future<void> clearCart();
  Future<List<SmartComboModel>> getSmartCombos(List<String> cartItemIds);
}

class CartRemoteDataSourceImpl implements CartRemoteDataSource {
  final ApiClient _apiClient;

  CartRemoteDataSourceImpl(this._apiClient);

  @override
  Future<CartState> getCart() async {
    final response = await _apiClient.get(ApiEndpoints.cart);
    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return CartState.fromJson(data);
    }
    return const CartState();
  }

  @override
  Future<CartState> addItem(String menuItemId, int quantity) async {
    final response = await _apiClient.post(
      ApiEndpoints.cartItems,
      data: {
        'menuItemId': menuItemId,
        'quantity': quantity,
      },
    );
    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return CartState.fromJson(data);
    }
    return const CartState();
  }

  @override
  Future<CartState> updateQuantity(String menuItemId, int quantity) async {
    final response = await _apiClient.put(
      ApiEndpoints.cartItem(menuItemId),
      queryParameters: {'quantity': quantity},
    );
    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return CartState.fromJson(data);
    }
    return const CartState();
  }

  @override
  Future<CartState> removeItem(String menuItemId) async {
    final response = await _apiClient.delete(ApiEndpoints.cartItem(menuItemId));
    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return CartState.fromJson(data);
    }
    return const CartState();
  }

  @override
  Future<void> clearCart() async {
    await _apiClient.delete(ApiEndpoints.cart);
  }

  @override
  Future<List<SmartComboModel>> getSmartCombos(List<String> cartItemIds) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.smartCombos,
        queryParameters: cartItemIds.isNotEmpty ? {'cartItemIds': cartItemIds} : null,
      );
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] is List) {
        final list = responseData['data'] as List<dynamic>;
        return list
            .map((item) => SmartComboModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      // Gracefully return empty list on network or empty response
    }
    return [];
  }
}

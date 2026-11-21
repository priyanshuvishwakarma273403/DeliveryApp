import 'package:foodiq_mobile/shared/models/cart_item_model.dart';

enum CartSyncStatus { idle, syncing, error }

class CartState {
  final String? restaurantId;
  final String? restaurantName;
  final List<CartItemModel> items;
  final CartSyncStatus syncStatus;
  final String? errorMessage;

  const CartState({
    this.restaurantId,
    this.restaurantName,
    this.items = const [],
    this.syncStatus = CartSyncStatus.idle,
    this.errorMessage,
  });

  bool get isEmpty => items.isEmpty;
  bool get isNotEmpty => items.isNotEmpty;
  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);
  double get subtotal => items.fold(0.0, (sum, item) => sum + item.subtotal);

  CartItemModel? getItem(String menuItemId) {
    try {
      return items.firstWhere((item) => item.menuItemId == menuItemId);
    } catch (_) {
      return null;
    }
  }

  int getItemQuantity(String menuItemId) {
    return getItem(menuItemId)?.quantity ?? 0;
  }

  CartState copyWith({
    String? restaurantId,
    String? restaurantName,
    List<CartItemModel>? items,
    CartSyncStatus? syncStatus,
    String? errorMessage,
  }) {
    return CartState(
      restaurantId: restaurantId ?? this.restaurantId,
      restaurantName: restaurantName ?? this.restaurantName,
      items: items ?? this.items,
      syncStatus: syncStatus ?? this.syncStatus,
      errorMessage: errorMessage,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'restaurantId': restaurantId,
      'restaurantName': restaurantName,
      'items': items.map((i) => i.toJson()).toList(),
    };
  }

  factory CartState.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return CartState(
      restaurantId: json['restaurantId']?.toString(),
      restaurantName: json['restaurantName']?.toString(),
      items: rawItems
          .map((i) => CartItemModel.fromJson(i as Map<String, dynamic>))
          .toList(),
    );
  }
}

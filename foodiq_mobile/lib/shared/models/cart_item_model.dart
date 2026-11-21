class CartItemModel {
  final String menuItemId;
  final String name;
  final double price;
  final String? imageUrl;
  final int quantity;
  final bool isVeg;

  const CartItemModel({
    required this.menuItemId,
    required this.name,
    required this.price,
    this.imageUrl,
    this.quantity = 1,
    this.isVeg = true,
  });

  double get subtotal => price * quantity;

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      menuItemId: json['menuItemId']?.toString() ?? json['id']?.toString() ?? '',
      name: json['menuItemName'] ?? json['name'] ?? '',
      price: (json['unitPrice'] is num)
          ? (json['unitPrice'] as num).toDouble()
          : (json['price'] is num)
              ? (json['price'] as num).toDouble()
              : 0.0,
      imageUrl: json['menuItemImage'] ?? json['imageUrl'],
      quantity: json['quantity'] is int ? json['quantity'] : 1,
      isVeg: json['isVeg'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'menuItemId': menuItemId,
      'name': name,
      'price': price,
      'imageUrl': imageUrl,
      'quantity': quantity,
      'isVeg': isVeg,
    };
  }
}

class OrderItemEntry {
  final String menuItemId;
  final String menuItemName;
  final String? menuItemImage;
  final int quantity;
  final double price;
  final double subtotal;

  const OrderItemEntry({
    required this.menuItemId,
    required this.menuItemName,
    this.menuItemImage,
    required this.quantity,
    required this.price,
    required this.subtotal,
  });

  factory OrderItemEntry.fromJson(Map<String, dynamic> json) {
    return OrderItemEntry(
      menuItemId: json['menuItemId']?.toString() ?? '',
      menuItemName: json['menuItemName'] ?? json['name'] ?? '',
      menuItemImage: json['menuItemImage'] ?? json['image'],
      quantity: json['quantity'] is int ? json['quantity'] : 1,
      price: (json['priceAtOrderTime'] is num)
          ? (json['priceAtOrderTime'] as num).toDouble()
          : (json['price'] is num)
              ? (json['price'] as num).toDouble()
              : 0.0,
      subtotal: (json['subtotal'] is num) ? (json['subtotal'] as num).toDouble() : 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'menuItemId': menuItemId,
      'menuItemName': menuItemName,
      'menuItemImage': menuItemImage,
      'quantity': quantity,
      'price': price,
      'subtotal': subtotal,
    };
  }
}

class DeliveryInfo {
  final int? deliveryPartnerId;
  final String? deliveryPartnerName;
  final String? deliveryPartnerPhone;
  final String? status;
  final double? currentLatitude;
  final double? currentLongitude;

  const DeliveryInfo({
    this.deliveryPartnerId,
    this.deliveryPartnerName,
    this.deliveryPartnerPhone,
    this.status,
    this.currentLatitude,
    this.currentLongitude,
  });

  factory DeliveryInfo.fromJson(Map<String, dynamic> json) {
    return DeliveryInfo(
      deliveryPartnerId: json['deliveryPartnerId'] is int
          ? json['deliveryPartnerId']
          : int.tryParse(json['deliveryPartnerId']?.toString() ?? ''),
      deliveryPartnerName: json['deliveryPartnerName']?.toString(),
      deliveryPartnerPhone: json['deliveryPartnerPhone']?.toString(),
      status: json['status']?.toString(),
      currentLatitude: (json['currentLatitude'] is num)
          ? (json['currentLatitude'] as num).toDouble()
          : null,
      currentLongitude: (json['currentLongitude'] is num)
          ? (json['currentLongitude'] as num).toDouble()
          : null,
    );
  }
}

class OrderModel {
  final int id;
  final int customerId;
  final String customerName;
  final String? customerPhone;
  final String restaurantId;
  final String restaurantName;
  final String status;
  final double totalAmount;
  final double finalAmount;
  final String deliveryAddress;
  final String paymentStatus;
  final String paymentMethod;
  final String? specialInstructions;
  final List<OrderItemEntry> orderItems;
  final DeliveryInfo? delivery;
  final DateTime? createdAt;

  const OrderModel({
    required this.id,
    required this.customerId,
    required this.customerName,
    this.customerPhone,
    required this.restaurantId,
    required this.restaurantName,
    required this.status,
    required this.totalAmount,
    required this.finalAmount,
    required this.deliveryAddress,
    required this.paymentStatus,
    required this.paymentMethod,
    this.specialInstructions,
    this.orderItems = const [],
    this.delivery,
    this.createdAt,
  });

  bool get isCancellable =>
      status == 'PLACED' || status == 'CONFIRMED';

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['orderItems'] as List<dynamic>? ?? [];
    final items = rawItems
        .map((i) => OrderItemEntry.fromJson(i as Map<String, dynamic>))
        .toList();

    DeliveryInfo? deliv;
    if (json['delivery'] != null && json['delivery'] is Map<String, dynamic>) {
      deliv = DeliveryInfo.fromJson(json['delivery'] as Map<String, dynamic>);
    }

    return OrderModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      customerId: json['customerId'] is int
          ? json['customerId']
          : int.tryParse(json['customerId'].toString()) ?? 0,
      customerName: json['customerName'] ?? 'Customer',
      customerPhone: json['customerPhone']?.toString(),
      restaurantId: json['restaurantId']?.toString() ?? '',
      restaurantName: json['restaurantName'] ?? 'Restaurant',
      status: json['status'] ?? 'PLACED',
      totalAmount: (json['totalAmount'] is num) ? (json['totalAmount'] as num).toDouble() : 0.0,
      finalAmount: (json['finalAmount'] is num) ? (json['finalAmount'] as num).toDouble() : 0.0,
      deliveryAddress: json['deliveryAddress'] ?? '',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      paymentMethod: json['paymentMethod'] ?? 'UPI',
      specialInstructions: json['specialInstructions']?.toString(),
      orderItems: items,
      delivery: deliv,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  OrderModel copyWith({
    String? status,
    DeliveryInfo? delivery,
  }) {
    return OrderModel(
      id: id,
      customerId: customerId,
      customerName: customerName,
      customerPhone: customerPhone,
      restaurantId: restaurantId,
      restaurantName: restaurantName,
      status: status ?? this.status,
      totalAmount: totalAmount,
      finalAmount: finalAmount,
      deliveryAddress: deliveryAddress,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      specialInstructions: specialInstructions,
      orderItems: orderItems,
      delivery: delivery ?? this.delivery,
      createdAt: createdAt,
    );
  }
}

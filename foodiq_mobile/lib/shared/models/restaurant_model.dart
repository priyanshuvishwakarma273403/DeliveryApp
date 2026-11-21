class RestaurantModel {
  final String id;
  final String name;
  final String address;
  final String city;
  final String cuisineType;
  final String? phone;
  final String? imageUrl;
  final double rating;
  final int avgDeliveryTime;
  final double minOrderAmount;
  final bool open;

  const RestaurantModel({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
    required this.cuisineType,
    this.phone,
    this.imageUrl,
    this.rating = 4.2,
    this.avgDeliveryTime = 30,
    this.minOrderAmount = 150.0,
    this.open = true,
  });

  factory RestaurantModel.fromJson(Map<String, dynamic> json) {
    return RestaurantModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      cuisineType: json['cuisineType'] ?? json['cuisine'] ?? 'Multi-Cuisine',
      phone: json['phone']?.toString(),
      imageUrl: json['imageUrl'] ?? json['image'],
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : 4.2,
      avgDeliveryTime: json['avgDeliveryTime'] is int ? json['avgDeliveryTime'] : 30,
      minOrderAmount: (json['minOrderAmount'] is num) ? (json['minOrderAmount'] as num).toDouble() : 150.0,
      open: json['open'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'city': city,
      'cuisineType': cuisineType,
      'phone': phone,
      'imageUrl': imageUrl,
      'rating': rating,
      'avgDeliveryTime': avgDeliveryTime,
      'minOrderAmount': minOrderAmount,
      'open': open,
    };
  }
}

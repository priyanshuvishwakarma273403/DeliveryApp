class MenuItemModel {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final String? imageUrl;
  final bool available;
  final String restaurantId;
  final String? restaurantName;
  final bool isVeg;

  const MenuItemModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    this.imageUrl,
    this.available = true,
    required this.restaurantId,
    this.restaurantName,
    this.isVeg = true,
  });

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    final name = json['name'] ?? '';
    final isVegImplicit = !name.toString().toLowerCase().contains('chicken') &&
        !name.toString().toLowerCase().contains('mutton') &&
        !name.toString().toLowerCase().contains('fish') &&
        !name.toString().toLowerCase().contains('egg') &&
        !name.toString().toLowerCase().contains('meat') &&
        !name.toString().toLowerCase().contains('prawn');

    return MenuItemModel(
      id: json['id']?.toString() ?? '',
      name: name,
      description: json['description'] ?? '',
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : 0.0,
      category: json['category'] ?? 'Main Course',
      imageUrl: json['imageUrl'] ?? json['image'],
      available: json['available'] ?? true,
      restaurantId: json['restaurantId']?.toString() ?? '',
      restaurantName: json['restaurantName']?.toString(),
      isVeg: json['isVeg'] ?? isVegImplicit,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'category': category,
      'imageUrl': imageUrl,
      'available': available,
      'restaurantId': restaurantId,
      'restaurantName': restaurantName,
      'isVeg': isVeg,
    };
  }
}

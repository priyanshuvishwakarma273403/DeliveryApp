import 'package:foodiq_mobile/shared/models/menu_item_model.dart';

class SmartComboModel {
  final String name;
  final List<MenuItemModel> items;
  final double originalPrice;
  final double comboPrice;
  final String description;

  const SmartComboModel({
    required this.name,
    required this.items,
    required this.originalPrice,
    required this.comboPrice,
    required this.description,
  });

  double get savings => originalPrice - comboPrice;
  int get discountPercentage => originalPrice > 0
      ? (((originalPrice - comboPrice) / originalPrice) * 100).round()
      : 0;

  factory SmartComboModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    final itemsList = rawItems
        .map((itemJson) => MenuItemModel.fromJson(itemJson as Map<String, dynamic>))
        .toList();

    return SmartComboModel(
      name: json['name'] ?? 'Smart Saver Combo',
      items: itemsList,
      originalPrice: (json['originalPrice'] is num)
          ? (json['originalPrice'] as num).toDouble()
          : 0.0,
      comboPrice: (json['comboPrice'] is num)
          ? (json['comboPrice'] as num).toDouble()
          : 0.0,
      description: json['description'] ?? 'Frequently bought together with savings',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'items': items.map((i) => i.toJson()).toList(),
      'originalPrice': originalPrice,
      'comboPrice': comboPrice,
      'description': description,
    };
  }
}

import 'package:foodiq_mobile/shared/models/menu_item_model.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';

class HomeRecommendationItem {
  final String id;
  final String name;
  final String? description;
  final double price;
  final String? imageUrl;
  final String? restaurantName;
  final String? reason; // e.g. "Because you love North Indian", "Trending in your area"

  const HomeRecommendationItem({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    this.restaurantName,
    this.reason,
  });

  factory HomeRecommendationItem.fromJson(Map<String, dynamic> json) {
    return HomeRecommendationItem(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description']?.toString(),
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : 0.0,
      imageUrl: json['imageUrl'] ?? json['image'],
      restaurantName: json['restaurantName']?.toString(),
      reason: json['reason']?.toString(),
    );
  }
}

class HomeFeedModel {
  final List<RestaurantModel> topRestaurants;
  final List<HomeRecommendationItem> recommendations;
  final List<String> trendingKeywords;

  const HomeFeedModel({
    this.topRestaurants = const [],
    this.recommendations = const [],
    this.trendingKeywords = const [],
  });
}

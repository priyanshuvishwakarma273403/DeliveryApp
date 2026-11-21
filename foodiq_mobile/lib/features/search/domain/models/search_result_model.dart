enum SearchItemType { restaurant, menuItem, cuisine, category }

class SearchResultItemModel {
  final String id;
  final String title;
  final String subtitle;
  final String? imageUrl;
  final SearchItemType type;
  final double? rating;
  final double? price;
  final String? restaurantId;

  const SearchResultItemModel({
    required this.id,
    required this.title,
    required this.subtitle,
    this.imageUrl,
    required this.type,
    this.rating,
    this.price,
    this.restaurantId,
  });

  factory SearchResultItemModel.fromJson(Map<String, dynamic> json) {
    SearchItemType itemType = SearchItemType.menuItem;
    final typeStr = json['type']?.toString().toUpperCase();
    if (typeStr == 'RESTAURANT') {
      itemType = SearchItemType.restaurant;
    } else if (typeStr == 'CUISINE') {
      itemType = SearchItemType.cuisine;
    }

    return SearchResultItemModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? json['name'] ?? '',
      subtitle: json['subtitle'] ?? json['description'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image'],
      type: itemType,
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : null,
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : null,
      restaurantId: json['restaurantId']?.toString(),
    );
  }
}

class SearchSuggestionModel {
  final String query;
  final String? category;

  const SearchSuggestionModel({required this.query, this.category});

  factory SearchSuggestionModel.fromJson(dynamic json) {
    if (json is String) {
      return SearchSuggestionModel(query: json);
    } else if (json is Map<String, dynamic>) {
      return SearchSuggestionModel(
        query: json['query'] ?? json['text'] ?? '',
        category: json['category']?.toString(),
      );
    }
    return const SearchSuggestionModel(query: '');
  }
}

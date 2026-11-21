enum RestaurantSortBy {
  relevance,
  rating,
  deliveryTime,
  costLowToHigh,
  costHighToLow;

  String toParamString() {
    switch (this) {
      case RestaurantSortBy.rating:
        return 'rating';
      case RestaurantSortBy.deliveryTime:
        return 'deliveryTime';
      case RestaurantSortBy.costLowToHigh:
        return 'costAsc';
      case RestaurantSortBy.costHighToLow:
        return 'costDesc';
      case RestaurantSortBy.relevance:
      default:
        return 'relevance';
    }
  }
}

class RestaurantFilter {
  final bool? isVegOnly;
  final double? minRating;
  final int? maxDeliveryMinutes;
  final String? cuisine;
  final String? city;
  final String? searchQuery;
  final RestaurantSortBy sortBy;

  const RestaurantFilter({
    this.isVegOnly,
    this.minRating,
    this.maxDeliveryMinutes,
    this.cuisine,
    this.city,
    this.searchQuery,
    this.sortBy = RestaurantSortBy.relevance,
  });

  RestaurantFilter copyWith({
    bool? isVegOnly,
    double? minRating,
    int? maxDeliveryMinutes,
    String? cuisine,
    String? city,
    String? searchQuery,
    RestaurantSortBy? sortBy,
  }) {
    return RestaurantFilter(
      isVegOnly: isVegOnly ?? this.isVegOnly,
      minRating: minRating ?? this.minRating,
      maxDeliveryMinutes: maxDeliveryMinutes ?? this.maxDeliveryMinutes,
      cuisine: cuisine ?? this.cuisine,
      city: city ?? this.city,
      searchQuery: searchQuery ?? this.searchQuery,
      sortBy: sortBy ?? this.sortBy,
    );
  }

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    if (minRating != null) params['minRating'] = minRating;
    if (cuisine != null && cuisine!.isNotEmpty && cuisine != 'All') params['cuisine'] = cuisine;
    if (city != null && city!.isNotEmpty) params['city'] = city;
    if (searchQuery != null && searchQuery!.isNotEmpty) params['search'] = searchQuery;
    return params;
  }
}

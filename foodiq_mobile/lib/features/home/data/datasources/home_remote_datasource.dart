import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/core/api/api_response.dart';
import 'package:foodiq_mobile/features/home/domain/models/home_feed_model.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';

class HomeRemoteDataSource {
  final ApiClient _apiClient;

  HomeRemoteDataSource(this._apiClient);

  Future<HomeFeedModel> getHomeFeed() async {
    List<RestaurantModel> restaurants = [];
    List<HomeRecommendationItem> recommendations = [];
    List<String> trending = [];

    // 1. Fetch Restaurants
    try {
      final res = await _apiClient.get(ApiEndpoints.restaurants, queryParameters: {'size': 8});
      final data = res.data;
      if (data is Map<String, dynamic>) {
        final apiRes = ApiResponse.fromJson(data, (json) {
          if (json is List) {
            return json.map((e) => RestaurantModel.fromJson(e as Map<String, dynamic>)).toList();
          } else if (json is Map<String, dynamic> && json.containsKey('content')) {
            final content = json['content'] as List;
            return content.map((e) => RestaurantModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <RestaurantModel>[];
        });
        restaurants = apiRes.data ?? [];
      }
    } catch (_) {}

    // 2. Fetch AI Recommendations from /api/v1/recommendations/home
    try {
      final res = await _apiClient.get(ApiEndpoints.recommendationsHome);
      final data = res.data;
      if (data is Map<String, dynamic>) {
        final apiRes = ApiResponse.fromJson(data, (json) {
          if (json is Map<String, dynamic>) {
            final list = <HomeRecommendationItem>[];
            json.forEach((key, val) {
              if (val is List) {
                list.addAll(val.map((item) => HomeRecommendationItem.fromJson(item as Map<String, dynamic>)));
              }
            });
            return list;
          }
          return <HomeRecommendationItem>[];
        });
        recommendations = apiRes.data ?? [];
      }
    } catch (_) {}

    return HomeFeedModel(
      topRestaurants: restaurants,
      recommendations: recommendations,
      trendingKeywords: trending,
    );
  }
}

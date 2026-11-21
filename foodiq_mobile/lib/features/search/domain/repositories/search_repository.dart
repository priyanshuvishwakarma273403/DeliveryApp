import 'package:foodiq_mobile/features/search/domain/models/search_result_model.dart';

abstract class SearchRepository {
  Future<List<SearchResultItemModel>> universalSearch({
    required String query,
    double latitude = 28.6139,
    double longitude = 77.2090,
  });

  Future<List<SearchSuggestionModel>> getAutocomplete(String query);
  Future<List<String>> getSearchHistory();
  Future<void> addSearchHistory(String query);
  Future<void> clearSearchHistory();
}

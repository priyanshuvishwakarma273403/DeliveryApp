import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/core/api/api_response.dart';
import 'package:foodiq_mobile/core/storage/local_storage_service.dart';
import 'package:foodiq_mobile/features/search/domain/models/search_result_model.dart';

class SearchRemoteDataSource {
  final ApiClient _apiClient;
  final LocalStorageService _localStorage;

  SearchRemoteDataSource(this._apiClient, this._localStorage);

  Future<List<SearchResultItemModel>> universalSearch({
    required String query,
    double latitude = 28.6139,
    double longitude = 77.2090,
  }) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.universalSearch,
        queryParameters: {
          'q': query,
          'lat': latitude,
          'lon': longitude,
          'limit': 30,
        },
      );

      final data = response.data;
      if (data is Map<String, dynamic>) {
        final apiRes = ApiResponse.fromJson(data, (json) {
          if (json is List) {
            return json.map((e) => SearchResultItemModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <SearchResultItemModel>[];
        });
        return apiRes.data ?? [];
      } else if (data is List) {
        return data.map((e) => SearchResultItemModel.fromJson(e as Map<String, dynamic>)).toList();
      }

      return [];
    } catch (_) {
      return [];
    }
  }

  Future<List<SearchSuggestionModel>> getAutocomplete(String query) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.searchAutocomplete,
        queryParameters: {'q': query},
      );

      final data = response.data;
      if (data is Map<String, dynamic>) {
        final apiRes = ApiResponse.fromJson(data, (json) {
          if (json is List) {
            return json.map((e) => SearchSuggestionModel.fromJson(e)).toList();
          }
          return <SearchSuggestionModel>[];
        });
        return apiRes.data ?? [];
      } else if (data is List) {
        return data.map((e) => SearchSuggestionModel.fromJson(e)).toList();
      }

      return [];
    } catch (_) {
      return [];
    }
  }

  List<String> getLocalHistory() {
    final raw = _localStorage.getString('foodiq_search_history');
    if (raw == null || raw.isEmpty) return ['Biryani', 'Pizza', 'Burger', 'Paneer Tikka'];
    return raw.split('||');
  }

  Future<void> saveLocalHistory(String query) async {
    if (query.trim().isEmpty) return;
    final current = getLocalHistory();
    current.remove(query);
    current.insert(0, query);
    final trimmed = current.take(10).toList();
    await _localStorage.setString('foodiq_search_history', trimmed.join('||'));
  }

  Future<void> clearLocalHistory() async {
    await _localStorage.remove('foodiq_search_history');
  }
}

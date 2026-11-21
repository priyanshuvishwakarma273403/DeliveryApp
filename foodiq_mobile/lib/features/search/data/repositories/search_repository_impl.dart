import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/storage/local_storage_service.dart';
import 'package:foodiq_mobile/features/search/data/datasources/search_remote_datasource.dart';
import 'package:foodiq_mobile/features/search/domain/models/search_result_model.dart';
import 'package:foodiq_mobile/features/search/domain/repositories/search_repository.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final localStorage = ref.watch(localStorageProvider);
  final remoteDataSource = SearchRemoteDataSource(apiClient, localStorage);
  return SearchRepositoryImpl(remoteDataSource);
});

class SearchRepositoryImpl implements SearchRepository {
  final SearchRemoteDataSource _remoteDataSource;

  SearchRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<SearchResultItemModel>> universalSearch({
    required String query,
    double latitude = 28.6139,
    double longitude = 77.2090,
  }) async {
    final results = await _remoteDataSource.universalSearch(
      query: query,
      latitude: latitude,
      longitude: longitude,
    );
    await _remoteDataSource.saveLocalHistory(query);
    return results;
  }

  @override
  Future<List<SearchSuggestionModel>> getAutocomplete(String query) async {
    return await _remoteDataSource.getAutocomplete(query);
  }

  @override
  Future<List<String>> getSearchHistory() async {
    return _remoteDataSource.getLocalHistory();
  }

  @override
  Future<void> addSearchHistory(String query) async {
    await _remoteDataSource.saveLocalHistory(query);
  }

  @override
  Future<void> clearSearchHistory() async {
    await _remoteDataSource.clearLocalHistory();
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/utils/debouncer.dart';
import 'package:foodiq_mobile/features/search/data/repositories/search_repository_impl.dart';
import 'package:foodiq_mobile/features/search/domain/models/search_result_model.dart';
import 'package:foodiq_mobile/features/search/domain/repositories/search_repository.dart';

class SearchState {
  final String query;
  final bool isLoading;
  final List<SearchResultItemModel> results;
  final List<SearchSuggestionModel> suggestions;
  final List<String> history;
  final String? errorMessage;

  const SearchState({
    this.query = '',
    this.isLoading = false,
    this.results = const [],
    this.suggestions = const [],
    this.history = const [],
    this.errorMessage,
  });

  SearchState copyWith({
    String? query,
    bool? isLoading,
    List<SearchResultItemModel>? results,
    List<SearchSuggestionModel>? suggestions,
    List<String>? history,
    String? errorMessage,
  }) {
    return SearchState(
      query: query ?? this.query,
      isLoading: isLoading ?? this.isLoading,
      results: results ?? this.results,
      suggestions: suggestions ?? this.suggestions,
      history: history ?? this.history,
      errorMessage: errorMessage,
    );
  }
}

final searchControllerProvider =
    StateNotifierProvider.autoDispose<SearchStateNotifier, SearchState>((ref) {
  final repository = ref.watch(searchRepositoryProvider);
  return SearchStateNotifier(repository);
});

class SearchStateNotifier extends StateNotifier<SearchState> {
  final SearchRepository _repository;
  final Debouncer _debouncer = Debouncer(milliseconds: 300);

  SearchStateNotifier(this._repository) : super(const SearchState()) {
    loadHistory();
  }

  Future<void> loadHistory() async {
    final history = await _repository.getSearchHistory();
    state = state.copyWith(history: history);
  }

  void onQueryChanged(String query) {
    state = state.copyWith(query: query);

    if (query.trim().isEmpty) {
      state = state.copyWith(suggestions: [], results: []);
      return;
    }

    _debouncer.run(() async {
      try {
        final suggestions = await _repository.getAutocomplete(query);
        state = state.copyWith(suggestions: suggestions);
      } catch (_) {}
    });
  }

  Future<void> executeSearch(String query) async {
    if (query.trim().isEmpty) return;

    state = state.copyWith(isLoading: true, errorMessage: null, query: query);
    try {
      final results = await _repository.universalSearch(query: query);
      final history = await _repository.getSearchHistory();
      state = state.copyWith(
        isLoading: false,
        results: results,
        suggestions: [],
        history: history,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> clearHistory() async {
    await _repository.clearSearchHistory();
    state = state.copyWith(history: []);
  }

  @override
  void dispose() {
    _debouncer.cancel();
    super.dispose();
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/features/home/data/datasources/home_remote_datasource.dart';
import 'package:foodiq_mobile/features/home/domain/models/home_feed_model.dart';
import 'package:foodiq_mobile/features/home/domain/repositories/home_repository.dart';

final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final remoteDataSource = HomeRemoteDataSource(apiClient);
  return HomeRepositoryImpl(remoteDataSource);
});

final homeFeedProvider = FutureProvider<HomeFeedModel>((ref) async {
  final repository = ref.watch(homeRepositoryProvider);
  return await repository.getHomeFeed();
});

class HomeRepositoryImpl implements HomeRepository {
  final HomeRemoteDataSource _remoteDataSource;

  HomeRepositoryImpl(this._remoteDataSource);

  @override
  Future<HomeFeedModel> getHomeFeed() async {
    return await _remoteDataSource.getHomeFeed();
  }
}

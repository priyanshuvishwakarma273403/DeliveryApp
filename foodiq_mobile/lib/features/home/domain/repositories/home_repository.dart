import 'package:foodiq_mobile/features/home/domain/models/home_feed_model.dart';

abstract class HomeRepository {
  Future<HomeFeedModel> getHomeFeed();
}

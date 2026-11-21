import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/features/notifications/data/datasources/notification_remote_datasource.dart';
import 'package:foodiq_mobile/features/notifications/domain/models/notification_model.dart';
import 'package:foodiq_mobile/features/notifications/domain/repositories/notification_repository.dart';

final notificationRemoteDataSourceProvider = Provider<NotificationRemoteDataSource>((ref) {
  return NotificationRemoteDataSourceImpl(ref.watch(apiClientProvider));
});

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepositoryImpl(ref.watch(notificationRemoteDataSourceProvider));
});

class NotificationRepositoryImpl implements NotificationRepository {
  final NotificationRemoteDataSource _remoteDataSource;

  NotificationRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<NotificationModel>> getInbox({String tab = 'ALL', int page = 1, int limit = 20}) async {
    return await _remoteDataSource.getInbox(tab: tab, page: page, limit: limit);
  }

  @override
  Future<int> getUnreadCount() async {
    return await _remoteDataSource.getUnreadCount();
  }

  @override
  Future<void> markAsRead(String notificationId) async {
    await _remoteDataSource.markAsRead(notificationId);
  }
}

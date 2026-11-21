import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/features/notifications/domain/models/notification_model.dart';

abstract class NotificationRemoteDataSource {
  Future<List<NotificationModel>> getInbox({String tab = 'ALL', int page = 1, int limit = 20});
  Future<int> getUnreadCount();
  Future<void> markAsRead(String notificationId);
}

class NotificationRemoteDataSourceImpl implements NotificationRemoteDataSource {
  final ApiClient _apiClient;

  NotificationRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<NotificationModel>> getInbox({String tab = 'ALL', int page = 1, int limit = 20}) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.notificationInbox,
        queryParameters: {'tab': tab, 'page': page, 'limit': limit},
      );
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] != null) {
        final data = responseData['data'];
        List<dynamic> content = [];
        if (data is Map<String, dynamic> && data['content'] is List) {
          content = data['content'] as List<dynamic>;
        } else if (data is List) {
          content = data;
        }
        return content
            .map((item) => NotificationModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  @override
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.unreadNotificationCount);
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] != null) {
        final d = responseData['data'];
        if (d is num) return d.toInt();
      }
    } catch (_) {}
    return 0;
  }

  @override
  Future<void> markAsRead(String notificationId) async {
    try {
      await _apiClient.put('/api/notifications/inbox/$notificationId/READ');
    } catch (_) {}
  }
}

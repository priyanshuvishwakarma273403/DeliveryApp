import 'package:foodiq_mobile/features/notifications/domain/models/notification_model.dart';

abstract class NotificationRepository {
  Future<List<NotificationModel>> getInbox({String tab = 'ALL', int page = 1, int limit = 20});
  Future<int> getUnreadCount();
  Future<void> markAsRead(String notificationId);
}

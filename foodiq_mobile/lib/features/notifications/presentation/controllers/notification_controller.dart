import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/notifications/data/repositories/notification_repository_impl.dart';
import 'package:foodiq_mobile/features/notifications/domain/models/notification_model.dart';

final notificationInboxProvider =
    AsyncNotifierProvider<NotificationInboxNotifier, List<NotificationModel>>(
  NotificationInboxNotifier.new,
);

final unreadNotificationCountProvider = FutureProvider<int>((ref) async {
  final repository = ref.watch(notificationRepositoryProvider);
  return repository.getUnreadCount();
});

class NotificationInboxNotifier extends AsyncNotifier<List<NotificationModel>> {
  @override
  Future<List<NotificationModel>> build() async {
    final repository = ref.watch(notificationRepositoryProvider);
    return await repository.getInbox();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(notificationRepositoryProvider);
      return await repository.getInbox();
    });
  }

  Future<void> markAsRead(String id) async {
    try {
      final repository = ref.read(notificationRepositoryProvider);
      await repository.markAsRead(id);

      final current = state.value ?? [];
      state = AsyncValue.data(
        current.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
      );
      ref.invalidate(unreadNotificationCountProvider);
    } catch (_) {}
  }
}

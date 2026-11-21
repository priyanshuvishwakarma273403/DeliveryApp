import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/notifications/domain/models/notification_model.dart';

void main() {
  group('NotificationModel Tests', () {
    test('should parse backend notification message successfully', () {
      final json = {
        'id': 'notif_1001',
        'title': 'Order Dispatched!',
        'body': 'Your Biryani from Punjabi Angithi is on its way with rider Ram.',
        'type': 'SUCCESS',
        'event': 'ORDER_DISPATCHED',
        'isRead': false,
        'timestamp': '2026-11-21T15:00:00',
      };

      final notif = NotificationModel.fromJson(json);

      expect(notif.id, 'notif_1001');
      expect(notif.title, 'Order Dispatched!');
      expect(notif.type, 'SUCCESS');
      expect(notif.isRead, false);
    });

    test('copyWith should allow marking notification as read', () {
      final notif = NotificationModel(
        id: 'n1',
        title: 'Special Offer',
        body: 'Flat 50% off on your next order with code FOODIQ50',
        timestamp: DateTime.now(),
      );

      final readNotif = notif.copyWith(isRead: true);
      expect(readNotif.id, 'n1');
      expect(readNotif.isRead, true);
    });
  });
}

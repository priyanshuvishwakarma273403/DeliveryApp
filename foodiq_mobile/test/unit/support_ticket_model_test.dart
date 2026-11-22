import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/profile/domain/models/support_ticket_model.dart';

void main() {
  group('SupportTicketModel Tests', () {
    test('should parse backend support ticket JSON correctly', () {
      final json = {
        'id': 'TKT-88912',
        'orderId': '1044',
        'issue': 'Delivery Issue: Order was marked delivered but not received',
        'priority': 'HIGH',
        'status': 'ACTIVE',
        'createdAt': '2026-11-21T16:00:00',
      };

      final ticket = SupportTicketModel.fromJson(json);

      expect(ticket.id, 'TKT-88912');
      expect(ticket.orderId, '1044');
      expect(ticket.priority, 'HIGH');
      expect(ticket.status, 'ACTIVE');
      expect(ticket.issue.contains('Delivery Issue'), true);
    });
  });
}

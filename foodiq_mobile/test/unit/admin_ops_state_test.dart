import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/admin/presentation/controllers/admin_ops_controller.dart';

void main() {
  group('AdminOpsState Tests', () {
    test('initial state should have empty stats and orders', () {
      const state = AdminOpsState();

      expect(state.isLoading, false);
      expect(state.stats.isEmpty, true);
      expect(state.orders.isEmpty, true);
    });

    test('copyWith should properly update platform metrics', () {
      const state = AdminOpsState();
      final updated = state.copyWith(
        stats: {
          'totalRevenue': 950000.0,
          'activeOrders': 45,
          'activeDrivers': 80,
        },
      );

      expect(updated.stats['totalRevenue'], 950000.0);
      expect(updated.stats['activeOrders'], 45);
      expect(updated.stats['activeDrivers'], 80);
    });
  });
}

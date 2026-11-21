import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/orders/data/repositories/order_repository_impl.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

final orderHistoryProvider =
    AsyncNotifierProvider<OrderHistoryNotifier, List<OrderModel>>(
  OrderHistoryNotifier.new,
);

class OrderHistoryNotifier extends AsyncNotifier<List<OrderModel>> {
  @override
  Future<List<OrderModel>> build() async {
    final repository = ref.watch(orderRepositoryProvider);
    return await repository.getMyOrders();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(orderRepositoryProvider);
      return await repository.getMyOrders();
    });
  }

  Future<bool> cancelOrder(int orderId, String reason) async {
    try {
      final repository = ref.read(orderRepositoryProvider);
      final updated = await repository.cancelOrder(orderId, reason);

      final current = state.value ?? [];
      state = AsyncValue.data(
        current.map((o) => o.id == orderId ? updated : o).toList(),
      );
      return true;
    } catch (_) {
      return false;
    }
  }
}

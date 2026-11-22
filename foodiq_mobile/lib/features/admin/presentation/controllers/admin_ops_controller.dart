import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/admin/data/admin_ops_repository.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

class AdminOpsState {
  final bool isLoading;
  final Map<String, dynamic> stats;
  final List<OrderModel> orders;
  final String? errorMessage;

  const AdminOpsState({
    this.isLoading = false,
    this.stats = const {},
    this.orders = const [],
    this.errorMessage,
  });

  AdminOpsState copyWith({
    bool? isLoading,
    Map<String, dynamic>? stats,
    List<OrderModel>? orders,
    String? errorMessage,
  }) {
    return AdminOpsState(
      isLoading: isLoading ?? this.isLoading,
      stats: stats ?? this.stats,
      orders: orders ?? this.orders,
      errorMessage: errorMessage,
    );
  }
}

final adminOpsControllerProvider =
    StateNotifierProvider<AdminOpsController, AdminOpsState>((ref) {
  final repo = ref.watch(adminOpsRepositoryProvider);
  return AdminOpsController(repo);
});

class AdminOpsController extends StateNotifier<AdminOpsState> {
  final AdminOpsRepository _repo;

  AdminOpsController(this._repo) : super(const AdminOpsState()) {
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true);
    try {
      final stats = await _repo.getDashboardStats();
      final orders = await _repo.getAllOrders();
      state = state.copyWith(isLoading: false, stats: stats, orders: orders);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    try {
      await _repo.overrideOrderStatus(orderId, status);
      final updated = state.orders.map((o) => o.id == orderId ? o.copyWith(status: status) : o).toList();
      state = state.copyWith(orders: updated);
    } catch (_) {}
  }
}

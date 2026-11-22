import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/restaurant/data/restaurant_ops_repository.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

class KdsState {
  final bool isLoading;
  final String activeTab; // 'NEW', 'COOKING', 'READY'
  final List<OrderModel> orders;
  final String? errorMessage;

  const KdsState({
    this.isLoading = false,
    this.activeTab = 'NEW',
    this.orders = const [],
    this.errorMessage,
  });

  List<OrderModel> get filteredOrders {
    switch (activeTab) {
      case 'COOKING':
        return orders.where((o) => o.status == 'PREPARING' || o.status == 'COOKING').toList();
      case 'READY':
        return orders.where((o) => o.status == 'FOOD_READY' || o.status == 'OUT_FOR_DELIVERY').toList();
      case 'NEW':
      default:
        return orders.where((o) => o.status == 'PLACED' || o.status == 'CONFIRMED').toList();
    }
  }

  KdsState copyWith({
    bool? isLoading,
    String? activeTab,
    List<OrderModel>? orders,
    String? errorMessage,
  }) {
    return KdsState(
      isLoading: isLoading ?? this.isLoading,
      activeTab: activeTab ?? this.activeTab,
      orders: orders ?? this.orders,
      errorMessage: errorMessage,
    );
  }
}

final kdsControllerProvider =
    StateNotifierProvider.family<KdsController, KdsState, String>((ref, restaurantId) {
  final repo = ref.watch(restaurantOpsRepositoryProvider);
  return KdsController(repo, restaurantId);
});

class KdsController extends StateNotifier<KdsState> {
  final RestaurantOpsRepository _repo;
  final String _restaurantId;

  KdsController(this._repo, this._restaurantId) : super(const KdsState()) {
    loadOrders();
  }

  void switchTab(String tab) {
    state = state.copyWith(activeTab: tab);
  }

  Future<void> loadOrders() async {
    state = state.copyWith(isLoading: true);
    try {
      final list = await _repo.getRestaurantOrders(_restaurantId);
      state = state.copyWith(isLoading: false, orders: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> startCooking(int orderId) async {
    try {
      await _repo.updateOrderStatus(orderId, 'PREPARING');
      final updated = state.orders.map((o) => o.id == orderId ? o.copyWith(status: 'PREPARING') : o).toList();
      state = state.copyWith(orders: updated);
    } catch (_) {}
  }

  Future<void> markReady(int orderId) async {
    try {
      await _repo.markFoodReady(_restaurantId, orderId);
      final updated = state.orders.map((o) => o.id == orderId ? o.copyWith(status: 'FOOD_READY') : o).toList();
      state = state.copyWith(orders: updated);
    } catch (_) {}
  }
}

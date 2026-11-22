import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/delivery/data/delivery_partner_repository.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

class RiderConsoleState {
  final bool isOnline;
  final bool isLoading;
  final List<OrderModel> availableOrders;
  final OrderModel? activeRun;
  final String? errorMessage;

  const RiderConsoleState({
    this.isOnline = false,
    this.isLoading = false,
    this.availableOrders = const [],
    this.activeRun,
    this.errorMessage,
  });

  RiderConsoleState copyWith({
    bool? isOnline,
    bool? isLoading,
    List<OrderModel>? availableOrders,
    OrderModel? activeRun,
    String? errorMessage,
  }) {
    return RiderConsoleState(
      isOnline: isOnline ?? this.isOnline,
      isLoading: isLoading ?? this.isLoading,
      availableOrders: availableOrders ?? this.availableOrders,
      activeRun: activeRun ?? this.activeRun,
      errorMessage: errorMessage,
    );
  }
}

final riderConsoleControllerProvider =
    StateNotifierProvider<RiderConsoleController, RiderConsoleState>((ref) {
  final repository = ref.watch(deliveryPartnerRepositoryProvider);
  return RiderConsoleController(repository);
});

class RiderConsoleController extends StateNotifier<RiderConsoleState> {
  final DeliveryPartnerRepository _repository;
  Timer? _gpsBroadcaster;
  double _currentLat = 28.5355;
  double _currentLon = 77.3910;

  RiderConsoleController(this._repository) : super(const RiderConsoleState());

  void toggleDutyStatus(bool online) {
    state = state.copyWith(isOnline: online);
    if (online) {
      loadAvailableGigs();
      _startGpsBroadcaster();
    } else {
      _gpsBroadcaster?.cancel();
    }
  }

  Future<void> loadAvailableGigs() async {
    if (!state.isOnline) return;
    state = state.copyWith(isLoading: true);
    try {
      final gigs = await _repository.getAvailableOrders();
      state = state.copyWith(isLoading: false, availableOrders: gigs);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> acceptOrder(OrderModel order) async {
    try {
      await _repository.acceptOrder(order.id);
      final updatedOrders = state.availableOrders.where((o) => o.id != order.id).toList();
      state = state.copyWith(
        availableOrders: updatedOrders,
        activeRun: order.copyWith(status: 'OUT_FOR_DELIVERY'),
      );
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  Future<void> markPickedUp(int orderId) async {
    try {
      await _repository.pickupOrder(orderId);
      if (state.activeRun != null && state.activeRun!.id == orderId) {
        state = state.copyWith(
          activeRun: state.activeRun!.copyWith(status: 'PICKED_UP'),
        );
      }
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  Future<void> markDelivered(int orderId) async {
    try {
      await _repository.deliverOrder(orderId);
      state = state.copyWith(activeRun: null);
      await loadAvailableGigs();
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  void _startGpsBroadcaster() {
    _gpsBroadcaster?.cancel();
    _gpsBroadcaster = Timer.periodic(const Duration(seconds: 5), (_) {
      if (state.activeRun != null) {
        // Simulate minor forward coordinate delta along route
        _currentLat += 0.0003;
        _currentLon += 0.0002;
        _repository.updateRiderLocation(state.activeRun!.id, _currentLat, _currentLon);
      }
    });
  }

  @override
  void dispose() {
    _gpsBroadcaster?.cancel();
    super.dispose();
  }
}

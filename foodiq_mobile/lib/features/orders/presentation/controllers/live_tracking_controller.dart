import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/utils/haversine.dart';
import 'package:foodiq_mobile/features/orders/data/repositories/order_repository_impl.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_digital_twin_model.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_status_enum.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_timeline_model.dart';
import 'package:foodiq_mobile/features/orders/domain/models/rider_location_model.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

class LiveTrackingState {
  final bool isLoading;
  final OrderModel? order;
  final RiderLocationModel? riderLocation;
  final OrderDigitalTwinModel? twin;
  final List<OrderTimelineModel> timeline;
  final double distanceKm;
  final int etaMinutes;
  final String? errorMessage;

  const LiveTrackingState({
    this.isLoading = true,
    this.order,
    this.riderLocation,
    this.twin,
    this.timeline = const [],
    this.distanceKm = 0.0,
    this.etaMinutes = 30,
    this.errorMessage,
  });

  OrderStatus get currentStatus => OrderStatus.fromString(order?.status);

  LiveTrackingState copyWith({
    bool? isLoading,
    OrderModel? order,
    RiderLocationModel? riderLocation,
    OrderDigitalTwinModel? twin,
    List<OrderTimelineModel>? timeline,
    double? distanceKm,
    int? etaMinutes,
    String? errorMessage,
  }) {
    return LiveTrackingState(
      isLoading: isLoading ?? this.isLoading,
      order: order ?? this.order,
      riderLocation: riderLocation ?? this.riderLocation,
      twin: twin ?? this.twin,
      timeline: timeline ?? this.timeline,
      distanceKm: distanceKm ?? this.distanceKm,
      etaMinutes: etaMinutes ?? this.etaMinutes,
      errorMessage: errorMessage,
    );
  }
}

final liveTrackingControllerProvider = StateNotifierProvider.autoDispose
    .family<LiveTrackingController, LiveTrackingState, int>((ref, orderId) {
  final repository = ref.watch(orderRepositoryProvider);
  return LiveTrackingController(repository, orderId);
});

class LiveTrackingController extends StateNotifier<LiveTrackingState> {
  final dynamic _repository;
  final int _orderId;

  // Assumed default customer delivery coords if missing
  static const double _defaultCustomerLat = 28.6139;
  static const double _defaultCustomerLon = 77.2090;

  LiveTrackingController(this._repository, this._orderId)
      : super(const LiveTrackingState()) {
    initTracking();
  }

  Future<void> initTracking() async {
    state = state.copyWith(isLoading: true);
    try {
      final order = await _repository.getOrderById(_orderId);
      final twin = await _repository.getOrderDigitalTwin(_orderId);
      final timeline = await _repository.getOrderTimeline(_orderId);

      RiderLocationModel? initialLocation;
      if (order.delivery?.currentLatitude != null &&
          order.delivery?.currentLongitude != null) {
        initialLocation = RiderLocationModel(
          orderId: _orderId,
          latitude: order.delivery!.currentLatitude!,
          longitude: order.delivery!.currentLongitude!,
          timestamp: DateTime.now(),
        );
      }

      final dist = initialLocation != null
          ? Haversine.distanceKm(
              initialLocation.latitude,
              initialLocation.longitude,
              _defaultCustomerLat,
              _defaultCustomerLon,
            )
          : 3.5;

      final eta = (dist * 4.5).round().clamp(5, 45);

      state = state.copyWith(
        isLoading: false,
        order: order,
        twin: twin,
        timeline: timeline,
        riderLocation: initialLocation,
        distanceKm: dist,
        etaMinutes: eta,
      );

      // Subscribe to STOMP WebSocket topics
      _repository.subscribeToOrderUpdates(_orderId, (updatedOrder) {
        state = state.copyWith(order: updatedOrder);
      });

      _repository.subscribeToRiderLocation(_orderId, (newLoc) {
        final newDist = Haversine.distanceKm(
          newLoc.latitude,
          newLoc.longitude,
          _defaultCustomerLat,
          _defaultCustomerLon,
        );
        final newEta = (newDist * 4.5).round().clamp(3, 40);

        state = state.copyWith(
          riderLocation: newLoc,
          distanceKm: newDist,
          etaMinutes: newEta,
        );
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<bool> cancelOrder(String reason) async {
    try {
      final cancelled = await _repository.cancelOrder(_orderId, reason);
      state = state.copyWith(order: cancelled);
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  void dispose() {
    _repository.unsubscribeFromOrder(_orderId);
    super.dispose();
  }
}

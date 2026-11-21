import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/cart/presentation/controllers/cart_controller.dart';
import 'package:foodiq_mobile/features/checkout/data/repositories/checkout_repository_impl.dart';
import 'package:foodiq_mobile/features/checkout/domain/models/checkout_pricing_model.dart';
import 'package:foodiq_mobile/features/checkout/domain/repositories/checkout_repository.dart';

class CheckoutState {
  final bool isLoading;
  final CheckoutPricingModel? pricing;
  final bool useCoins;
  final double availableCoins;
  final double tipAmount;
  final String? promoCode;
  final String? deliveryInstructions;
  final String? errorMessage;

  const CheckoutState({
    this.isLoading = false,
    this.pricing,
    this.useCoins = false,
    this.availableCoins = 0.0,
    this.tipAmount = 0.0,
    this.promoCode,
    this.deliveryInstructions,
    this.errorMessage,
  });

  double get grandTotalWithTip =>
      (pricing != null ? pricing!.finalAmount : 0.0) + tipAmount;

  CheckoutState copyWith({
    bool? isLoading,
    CheckoutPricingModel? pricing,
    bool? useCoins,
    double? availableCoins,
    double? tipAmount,
    String? promoCode,
    String? deliveryInstructions,
    String? errorMessage,
  }) {
    return CheckoutState(
      isLoading: isLoading ?? this.isLoading,
      pricing: pricing ?? this.pricing,
      useCoins: useCoins ?? this.useCoins,
      availableCoins: availableCoins ?? this.availableCoins,
      tipAmount: tipAmount ?? this.tipAmount,
      promoCode: promoCode ?? this.promoCode,
      deliveryInstructions: deliveryInstructions ?? this.deliveryInstructions,
      errorMessage: errorMessage,
    );
  }
}

final checkoutControllerProvider =
    StateNotifierProvider<CheckoutController, CheckoutState>((ref) {
  final repository = ref.watch(checkoutRepositoryProvider);
  final authState = ref.watch(authControllerProvider);
  final userId = authState.user?.id;
  final cart = ref.watch(cartControllerProvider);

  return CheckoutController(
    repository: repository,
    userId: userId,
    subtotal: cart.subtotal,
  );
});

class CheckoutController extends StateNotifier<CheckoutState> {
  final CheckoutRepository _repository;
  final int? _userId;
  double _subtotal;

  CheckoutController({
    required CheckoutRepository repository,
    int? userId,
    required double subtotal,
  })  : _repository = repository,
        _userId = userId,
        _subtotal = subtotal,
        super(const CheckoutState()) {
    initCheckout();
  }

  Future<void> initCheckout() async {
    state = state.copyWith(isLoading: true);
    double coins = 0.0;
    if (_userId != null) {
      try {
        coins = await _repository.getUserWalletBalance(_userId);
      } catch (_) {}
    }

    try {
      final pricing = await _repository.getAuthoritativePricing(
        subtotal: _subtotal,
        userId: _userId,
      );
      state = state.copyWith(
        isLoading: false,
        pricing: pricing,
        availableCoins: coins,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> toggleCoins(bool use) async {
    state = state.copyWith(useCoins: use, isLoading: true);
    final coinsToApply = use ? state.availableCoins : 0.0;

    try {
      final pricing = await _repository.getAuthoritativePricing(
        subtotal: _subtotal,
        coinsUsed: coinsToApply,
        userId: _userId,
      );
      state = state.copyWith(isLoading: false, pricing: pricing);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  void setTip(double tip) {
    state = state.copyWith(tipAmount: tip);
  }

  void setDeliveryInstructions(String instructions) {
    state = state.copyWith(deliveryInstructions: instructions);
  }

  Future<void> applyPromoCode(String code) async {
    // Check coupon logic
    double discount = 0.0;
    if (code.toUpperCase() == 'WELCOME50') {
      discount = 50.0;
    } else if (code.toUpperCase() == 'FOODIQ100') {
      discount = 100.0;
    }

    state = state.copyWith(isLoading: true, promoCode: code);
    try {
      final pricing = await _repository.getAuthoritativePricing(
        subtotal: _subtotal,
        discount: discount,
        coinsUsed: state.useCoins ? state.availableCoins : 0.0,
        userId: _userId,
      );
      state = state.copyWith(isLoading: false, pricing: pricing);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }
}

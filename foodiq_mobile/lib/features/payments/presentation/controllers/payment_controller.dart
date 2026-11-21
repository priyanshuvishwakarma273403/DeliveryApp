import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/cart/presentation/controllers/cart_controller.dart';
import 'package:foodiq_mobile/features/payments/data/repositories/payment_repository_impl.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_method_enum.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_transaction_model.dart';
import 'package:foodiq_mobile/features/payments/domain/repositories/payment_repository.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';
import 'package:uuid/uuid.dart';

enum PaymentProcessingStatus {
  idle,
  placingOrder,
  processingPayment,
  success,
  failed,
}

class PaymentState {
  final PaymentProcessingStatus status;
  final PaymentMethod selectedMethod;
  final OrderModel? placedOrder;
  final PaymentTransactionModel? transaction;
  final String? errorMessage;
  final int earnedCoins;

  const PaymentState({
    this.status = PaymentProcessingStatus.idle,
    this.selectedMethod = PaymentMethod.upi,
    this.placedOrder,
    this.transaction,
    this.errorMessage,
    this.earnedCoins = 0,
  });

  bool get isLoading =>
      status == PaymentProcessingStatus.placingOrder ||
      status == PaymentProcessingStatus.processingPayment;

  PaymentState copyWith({
    PaymentProcessingStatus? status,
    PaymentMethod? selectedMethod,
    OrderModel? placedOrder,
    PaymentTransactionModel? transaction,
    String? errorMessage,
    int? earnedCoins,
  }) {
    return PaymentState(
      status: status ?? this.status,
      selectedMethod: selectedMethod ?? this.selectedMethod,
      placedOrder: placedOrder ?? this.placedOrder,
      transaction: transaction ?? this.transaction,
      errorMessage: errorMessage,
      earnedCoins: earnedCoins ?? this.earnedCoins,
    );
  }
}

final paymentControllerProvider =
    StateNotifierProvider<PaymentController, PaymentState>((ref) {
  final repository = ref.watch(paymentRepositoryProvider);
  final authState = ref.watch(authControllerProvider);
  final cartNotifier = ref.read(cartControllerProvider.notifier);

  return PaymentController(
    repository: repository,
    customerId: authState.user?.id.toString() ?? '',
    cartNotifier: cartNotifier,
  );
});

class PaymentController extends StateNotifier<PaymentState> {
  final PaymentRepository _repository;
  final String _customerId;
  final CartController _cartNotifier;
  static const _uuid = Uuid();

  PaymentController({
    required PaymentRepository repository,
    required String customerId,
    required CartController cartNotifier,
  })  : _repository = repository,
        _customerId = customerId,
        _cartNotifier = cartNotifier,
        super(const PaymentState());

  void selectPaymentMethod(PaymentMethod method) {
    state = state.copyWith(selectedMethod: method);
  }

  Future<bool> executeCheckoutAndPayment({
    required String restaurantId,
    required String deliveryAddress,
    required double amount,
    double walletDeduction = 0.0,
    String? specialInstructions,
    bool useCoins = false,
  }) async {
    state = state.copyWith(
      status: PaymentProcessingStatus.placingOrder,
      errorMessage: null,
    );

    try {
      // 1. Place Order via POST /orders
      final order = await _repository.placeOrder(
        deliveryAddress: deliveryAddress,
        paymentMethod: state.selectedMethod,
        specialInstructions: specialInstructions,
        useCoins: useCoins,
      );

      state = state.copyWith(
        status: PaymentProcessingStatus.processingPayment,
        placedOrder: order,
      );

      // 2. Process Payment via POST /finance/pay with unique Idempotency Key
      final idempotencyKey = _uuid.v4();
      final transaction = await _repository.processPayment(
        orderId: order.id.toString(),
        customerId: _customerId,
        restaurantId: restaurantId,
        amount: amount,
        walletDeduction: walletDeduction,
        paymentMethod: state.selectedMethod,
        gateway: 'RAZORPAY',
        idempotencyKey: idempotencyKey,
      );

      // 3. Calculate post-checkout reward coins (e.g. 5% of order amount)
      final coinsEarned = (amount * 0.05).round().clamp(10, 100);

      // 4. Clear cart upon successful order
      await _cartNotifier.clearCart();

      state = state.copyWith(
        status: PaymentProcessingStatus.success,
        transaction: transaction,
        earnedCoins: coinsEarned,
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        status: PaymentProcessingStatus.failed,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  void reset() {
    state = const PaymentState();
  }
}

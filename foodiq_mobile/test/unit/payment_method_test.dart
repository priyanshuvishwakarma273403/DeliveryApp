import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_method_enum.dart';
import 'package:foodiq_mobile/features/payments/domain/models/payment_transaction_model.dart';

void main() {
  group('PaymentMethod & Transaction Model Tests', () {
    test('should map payment methods to valid Spring Boot backend codes', () {
      expect(PaymentMethod.upi.backendCode, 'UPI');
      expect(PaymentMethod.card.backendCode, 'CARD');
      expect(PaymentMethod.wallet.backendCode, 'WALLET');
      expect(PaymentMethod.cod.backendCode, 'COD');
    });

    test('should parse backend Transaction JSON successfully', () {
      final json = {
        'id': 'tx_998822',
        'orderId': '1044',
        'customerId': '42',
        'restaurantId': 'rest_07',
        'amount': 450.0,
        'walletDeductionAmount': 50.0,
        'paymentMethod': 'UPI',
        'gatewayName': 'RAZORPAY',
        'status': 'COMPLETED',
        'gatewayTransactionId': 'RAZ_abc123xyz',
        'timestamp': '2026-11-21T14:30:00',
      };

      final tx = PaymentTransactionModel.fromJson(json);

      expect(tx.id, 'tx_998822');
      expect(tx.orderId, '1044');
      expect(tx.customerId, '42');
      expect(tx.restaurantId, 'rest_07');
      expect(tx.amount, 450.0);
      expect(tx.walletDeductionAmount, 50.0);
      expect(tx.paymentMethod, 'UPI');
      expect(tx.gatewayName, 'RAZORPAY');
      expect(tx.status, 'COMPLETED');
      expect(tx.isSuccess, true);
      expect(tx.gatewayTransactionId, 'RAZ_abc123xyz');
    });

    test('isSuccess should return false if status is PENDING or FAILED', () {
      final pendingTx = PaymentTransactionModel.fromJson({
        'id': 'tx_1',
        'orderId': '1',
        'customerId': '1',
        'restaurantId': '1',
        'amount': 100.0,
        'status': 'FAILED',
      });

      expect(pendingTx.isSuccess, false);
    });
  });
}

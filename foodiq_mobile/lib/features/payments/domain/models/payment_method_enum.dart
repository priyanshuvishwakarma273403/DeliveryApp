import 'package:flutter/material.dart';

enum PaymentMethod {
  upi,
  card,
  wallet,
  cod;

  String get displayName {
    switch (this) {
      case PaymentMethod.upi:
        return 'UPI';
      case PaymentMethod.card:
        return 'Credit / Debit Card';
      case PaymentMethod.wallet:
        return 'FoodIQ Wallet / Coins';
      case PaymentMethod.cod:
        return 'Cash on Delivery';
    }
  }

  String get subtitle {
    switch (this) {
      case PaymentMethod.upi:
        return 'Google Pay, PhonePe, Paytm, BHIM';
      case PaymentMethod.card:
        return 'Visa, MasterCard, RuPay, Maestro';
      case PaymentMethod.wallet:
        return 'Instant 1-click checkout';
      case PaymentMethod.cod:
        return 'Pay cash or UPI at the doorstep';
    }
  }

  IconData get icon {
    switch (this) {
      case PaymentMethod.upi:
        return Icons.qr_code_2;
      case PaymentMethod.card:
        return Icons.credit_card;
      case PaymentMethod.wallet:
        return Icons.account_balance_wallet;
      case PaymentMethod.cod:
        return Icons.payments_outlined;
    }
  }

  String get backendCode {
    switch (this) {
      case PaymentMethod.upi:
        return 'UPI';
      case PaymentMethod.card:
        return 'CARD';
      case PaymentMethod.wallet:
        return 'WALLET';
      case PaymentMethod.cod:
        return 'COD';
    }
  }
}

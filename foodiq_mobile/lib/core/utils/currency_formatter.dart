import 'package:intl/intl.dart';

class CurrencyFormatter {
  static final NumberFormat _formatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static final NumberFormat _decimalFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  static String format(num? amount) {
    if (amount == null) return '₹0';
    if (amount % 1 == 0) {
      return _formatter.format(amount);
    }
    return _decimalFormatter.format(amount);
  }
}

import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';

void main() {
  group('CurrencyFormatter Tests', () {
    test('should format integer amounts with Rupee symbol and no decimals', () {
      expect(CurrencyFormatter.format(150), '₹150');
      expect(CurrencyFormatter.format(0), '₹0');
      expect(CurrencyFormatter.format(1250), '₹1,250');
    });

    test('should format fractional amounts with 2 decimal places', () {
      expect(CurrencyFormatter.format(149.50), '₹149.50');
      expect(CurrencyFormatter.format(29.99), '₹29.99');
    });

    test('should handle null amount safely', () {
      expect(CurrencyFormatter.format(null), '₹0');
    });
  });
}

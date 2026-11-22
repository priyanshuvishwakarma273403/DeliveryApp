import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_wallet_model.dart';

void main() {
  group('UserWalletModel Tests', () {
    test('should parse Spring Boot wallet JSON accurately', () {
      final json = {
        'id': 12,
        'userId': 45,
        'balance': 350.50,
        'goldMember': true,
        'currency': 'INR',
      };

      final wallet = UserWalletModel.fromJson(json);

      expect(wallet.id, 12);
      expect(wallet.userId, 45);
      expect(wallet.balance, 350.50);
      expect(wallet.isGoldMember, true);
      expect(wallet.currency, 'INR');
    });

    test('should default to non-gold member if missing', () {
      final json = {
        'id': 1,
        'userId': 10,
        'balance': 0.0,
      };

      final wallet = UserWalletModel.fromJson(json);

      expect(wallet.isGoldMember, false);
      expect(wallet.balance, 0.0);
    });
  });
}

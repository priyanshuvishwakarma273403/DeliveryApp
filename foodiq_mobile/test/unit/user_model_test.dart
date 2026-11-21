import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';

void main() {
  group('UserModel Role Parsing Tests', () {
    test('should correctly parse customer role', () {
      final user = UserModel.fromJson({
        'id': 10,
        'name': 'Priyanshu',
        'email': 'priyanshu@example.com',
        'role': 'ROLE_CUSTOMER',
      });

      expect(user.role, UserRole.customer);
      expect(user.role.toDisplayString(), 'Customer');
    });

    test('should correctly parse delivery partner role', () {
      final user = UserModel.fromJson({
        'id': 11,
        'name': 'Rider Ram',
        'email': 'rider@example.com',
        'role': 'DELIVERY_PARTNER',
      });

      expect(user.role, UserRole.deliveryPartner);
      expect(user.role.toDisplayString(), 'Delivery Partner');
    });

    test('should correctly parse restaurant owner role', () {
      final user = UserModel.fromJson({
        'id': 12,
        'name': 'Chef Sanjeev',
        'email': 'owner@example.com',
        'role': 'RESTAURANT_OWNER',
      });

      expect(user.role, UserRole.restaurantOwner);
      expect(user.role.toDisplayString(), 'Restaurant Owner');
    });

    test('should correctly parse administrator role', () {
      final user = UserModel.fromJson({
        'id': 1,
        'name': 'Platform Admin',
        'email': 'admin@example.com',
        'role': 'ROLE_ADMIN',
      });

      expect(user.role, UserRole.admin);
      expect(user.role.toDisplayString(), 'Platform Admin');
    });
  });
}

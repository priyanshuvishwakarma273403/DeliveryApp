import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_state.dart';

void main() {
  group('AuthState State Management Tests', () {
    test('initial state should be unauthenticated and not loading', () {
      const state = AuthState();
      expect(state.status, AuthStatus.initial);
      expect(state.isAuthenticated, isFalse);
      expect(state.isLoading, isFalse);
      expect(state.user, isNull);
    });

    test('authenticated state should report true when user is present', () {
      const user = UserModel(
        id: 1,
        name: 'Test Customer',
        email: 'test@example.com',
        role: UserRole.customer,
      );

      final state = const AuthState().copyWith(
        status: AuthStatus.authenticated,
        user: user,
      );

      expect(state.isAuthenticated, isTrue);
      expect(state.currentRole, UserRole.customer);
      expect(state.user?.name, 'Test Customer');
    });

    test('error state should contain error message', () {
      final state = const AuthState().copyWith(
        status: AuthStatus.error,
        errorMessage: 'Invalid credentials provided',
      );

      expect(state.status, AuthStatus.error);
      expect(state.errorMessage, 'Invalid credentials provided');
      expect(state.isAuthenticated, isFalse);
    });
  });
}

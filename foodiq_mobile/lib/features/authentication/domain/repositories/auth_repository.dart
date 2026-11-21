import 'package:foodiq_mobile/features/authentication/domain/models/auth_tokens.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';

abstract class AuthRepository {
  Future<({UserModel user, AuthTokens tokens})> login({
    required String email,
    required String password,
  });

  Future<void> sendOtp({required String email});

  Future<({UserModel user, AuthTokens tokens})> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String address,
    required String otp,
    String role = 'CUSTOMER',
  });

  Future<({UserModel user, AuthTokens tokens})> googleLogin({
    required String idToken,
  });

  Future<void> logout();

  Future<UserModel?> restoreSession();
}

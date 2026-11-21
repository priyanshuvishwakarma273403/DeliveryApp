import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/errors/error_handler.dart';
import 'package:foodiq_mobile/features/authentication/data/repositories/auth_repository_impl.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';
import 'package:foodiq_mobile/features/authentication/domain/repositories/auth_repository.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_state.dart';

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  return AuthController(authRepository);
});

class AuthController extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;

  AuthController(this._authRepository) : super(const AuthState());

  Future<void> restoreSession() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final user = await _authRepository.restoreSession();
      if (user != null) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
          errorMessage: null,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          user: null,
          errorMessage: null,
        );
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        user: null,
        errorMessage: null,
      );
    }
  }

  Future<bool> login({required String email, required String password}) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final result = await _authRepository.login(email: email, password: password);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: result.user,
        errorMessage: null,
      );
      return true;
    } catch (e) {
      final failure = ErrorHandler.handleGenericError(e);
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      );
      return false;
    }
  }

  Future<bool> sendOtp({required String email}) async {
    try {
      await _authRepository.sendOtp(email: email);
      return true;
    } catch (e) {
      final failure = ErrorHandler.handleGenericError(e);
      state = state.copyWith(errorMessage: failure.message);
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String address,
    required String otp,
    String role = 'CUSTOMER',
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final result = await _authRepository.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
        address: address,
        otp: otp,
        role: role,
      );
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: result.user,
        errorMessage: null,
      );
      return true;
    } catch (e) {
      final failure = ErrorHandler.handleGenericError(e);
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      );
      return false;
    }
  }

  Future<bool> googleLogin({required String idToken}) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final result = await _authRepository.googleLogin(idToken: idToken);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: result.user,
        errorMessage: null,
      );
      return true;
    } catch (e) {
      final failure = ErrorHandler.handleGenericError(e);
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _authRepository.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

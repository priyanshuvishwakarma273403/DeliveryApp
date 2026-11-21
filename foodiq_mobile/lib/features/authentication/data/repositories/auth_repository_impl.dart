import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/config/app_constants.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/storage/secure_storage_service.dart';
import 'package:foodiq_mobile/features/authentication/data/datasources/auth_remote_datasource.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/auth_tokens.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';
import 'package:foodiq_mobile/features/authentication/domain/repositories/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  final remoteDataSource = AuthRemoteDataSource(apiClient);
  return AuthRepositoryImpl(remoteDataSource, secureStorage);
});

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final SecureStorageService _secureStorage;

  AuthRepositoryImpl(this._remoteDataSource, this._secureStorage);

  @override
  Future<({UserModel user, AuthTokens tokens})> login({
    required String email,
    required String password,
  }) async {
    final result = await _remoteDataSource.login(email: email, password: password);
    await _persistSession(result.user, result.tokens);
    return result;
  }

  @override
  Future<void> sendOtp({required String email}) async {
    await _remoteDataSource.sendOtp(email: email);
  }

  @override
  Future<({UserModel user, AuthTokens tokens})> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String address,
    required String otp,
    String role = 'CUSTOMER',
  }) async {
    final result = await _remoteDataSource.register(
      name: name,
      email: email,
      password: password,
      phone: phone,
      address: address,
      otp: otp,
      role: role,
    );
    await _persistSession(result.user, result.tokens);
    return result;
  }

  @override
  Future<({UserModel user, AuthTokens tokens})> googleLogin({
    required String idToken,
  }) async {
    final result = await _remoteDataSource.googleLogin(idToken: idToken);
    await _persistSession(result.user, result.tokens);
    return result;
  }

  @override
  Future<void> logout() async {
    await _secureStorage.delete(AppConstants.tokenKey);
    await _secureStorage.delete(AppConstants.refreshTokenKey);
    await _secureStorage.delete(AppConstants.userKey);
  }

  @override
  Future<UserModel?> restoreSession() async {
    final token = await _secureStorage.read(AppConstants.tokenKey);
    final userJson = await _secureStorage.read(AppConstants.userKey);

    if (token == null || token.isEmpty || userJson == null) {
      return null;
    }

    try {
      final map = jsonDecode(userJson) as Map<String, dynamic>;
      return UserModel.fromJson(map);
    } catch (e) {
      await logout();
      return null;
    }
  }

  Future<void> _persistSession(UserModel user, AuthTokens tokens) async {
    await _secureStorage.write(AppConstants.tokenKey, tokens.accessToken);
    if (tokens.refreshToken != null) {
      await _secureStorage.write(AppConstants.refreshTokenKey, tokens.refreshToken!);
    }
    await _secureStorage.write(AppConstants.userKey, jsonEncode(user.toJson()));
  }
}

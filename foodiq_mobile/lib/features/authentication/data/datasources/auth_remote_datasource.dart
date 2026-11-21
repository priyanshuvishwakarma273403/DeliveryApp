import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/core/api/api_response.dart';
import 'package:foodiq_mobile/core/errors/app_exception.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/auth_tokens.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';

class AuthRemoteDataSource {
  final ApiClient _apiClient;

  AuthRemoteDataSource(this._apiClient);

  Future<({UserModel user, AuthTokens tokens})> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.login,
        data: {'email': email, 'password': password},
      );

      final apiResponse = ApiResponse.fromJson(
        response.data as Map<String, dynamic>,
        (json) => json as Map<String, dynamic>,
      );

      if (!apiResponse.success || apiResponse.data == null) {
        throw ServerException(message: apiResponse.message.isNotEmpty ? apiResponse.message : 'Invalid credentials');
      }

      final data = apiResponse.data!;
      final tokens = AuthTokens.fromJson(data);
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

      return (user: user, tokens: tokens);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> sendOtp({required String email}) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.sendOtp,
        queryParameters: {'email': email},
      );

      final apiResponse = ApiResponse.fromJson(
        response.data as Map<String, dynamic>,
        null,
      );

      if (!apiResponse.success) {
        throw ServerException(message: apiResponse.message);
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<({UserModel user, AuthTokens tokens})> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String address,
    required String otp,
    String role = 'CUSTOMER',
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.register,
        data: {
          'name': name,
          'email': email,
          'password': password,
          'phone': phone,
          'address': address,
          'role': role,
          'otp': otp,
        },
      );

      final apiResponse = ApiResponse.fromJson(
        response.data as Map<String, dynamic>,
        (json) => json as Map<String, dynamic>,
      );

      if (!apiResponse.success || apiResponse.data == null) {
        throw ServerException(message: apiResponse.message);
      }

      final data = apiResponse.data!;
      final tokens = AuthTokens.fromJson(data);
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

      return (user: user, tokens: tokens);
    } catch (e) {
      rethrow;
    }
  }

  Future<({UserModel user, AuthTokens tokens})> googleLogin({
    required String idToken,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.googleLogin,
        data: idToken,
      );

      final apiResponse = ApiResponse.fromJson(
        response.data as Map<String, dynamic>,
        (json) => json as Map<String, dynamic>,
      );

      if (!apiResponse.success || apiResponse.data == null) {
        throw ServerException(message: apiResponse.message);
      }

      final data = apiResponse.data!;
      final tokens = AuthTokens.fromJson(data);
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

      return (user: user, tokens: tokens);
    } catch (e) {
      rethrow;
    }
  }
}

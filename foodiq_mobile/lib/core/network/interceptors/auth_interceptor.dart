import 'package:dio/dio.dart';
import 'package:foodiq_mobile/app/config/app_constants.dart';
import 'package:foodiq_mobile/core/storage/secure_storage_service.dart';

class AuthInterceptor extends QueuedInterceptor {
  final SecureStorageService _secureStorage;
  final void Function()? onSessionExpired;

  AuthInterceptor(this._secureStorage, {this.onSessionExpired});

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _secureStorage.read(AppConstants.tokenKey);
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    options.headers['Accept'] = 'application/json';
    options.headers['Content-Type'] = 'application/json';
    return handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Clear expired tokens
      await _secureStorage.delete(AppConstants.tokenKey);
      await _secureStorage.delete(AppConstants.refreshTokenKey);
      await _secureStorage.delete(AppConstants.userKey);

      // Trigger session expiration callback
      onSessionExpired?.call();
    }
    return handler.next(err);
  }
}

import 'package:dio/dio.dart';
import 'package:foodiq_mobile/core/errors/app_exception.dart';
import 'package:foodiq_mobile/core/errors/failure.dart';

class ErrorHandler {
  static Failure handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkFailure(message: 'Connection timed out. Server is taking too long to respond.');
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final responseData = error.response?.data;
        String message = 'Server error occurred.';

        if (responseData is Map<String, dynamic>) {
          message = responseData['message'] ?? responseData['error'] ?? message;
        }

        if (statusCode == 401) {
          return AuthFailure(message: message, code: statusCode);
        } else if (statusCode == 403) {
          return AuthFailure(message: 'Forbidden: $message', code: statusCode);
        } else if (statusCode == 404) {
          return ServerFailure(message: message, code: statusCode);
        } else if (statusCode != null && statusCode >= 500) {
          return ServerFailure(message: 'Internal server error. Please try again later.', code: statusCode);
        }
        return ServerFailure(message: message, code: statusCode);
      case DioExceptionType.connectionError:
        return const NetworkFailure(message: 'Cannot reach FoodIQ server. Verify your internet or backend URL.');
      case DioExceptionType.cancel:
        return const ServerFailure(message: 'Request was cancelled.');
      default:
        return ServerFailure(message: error.message ?? 'An unexpected network error occurred.');
    }
  }

  static Failure handleGenericError(dynamic error) {
    if (error is AppException) {
      return ServerFailure(message: error.message, code: error.statusCode);
    }
    return ServerFailure(message: error.toString());
  }
}

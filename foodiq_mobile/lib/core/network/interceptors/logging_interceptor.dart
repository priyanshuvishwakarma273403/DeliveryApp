import 'package:dio/dio.dart';
import 'package:foodiq_mobile/bootstrap.dart';

class SafeLoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    logger.d(
      '🌐 [HTTP REQUEST] ${options.method.toUpperCase()} ${options.uri}\n'
      'Headers: ${_sanitizeHeaders(options.headers)}\n'
      'Params: ${options.queryParameters}\n'
      'Body: ${_sanitizeBody(options.data)}',
    );
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    logger.d(
      '✅ [HTTP RESPONSE] ${response.statusCode} ${response.requestOptions.uri}\n'
      'Data: ${_truncate(response.data)}',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    logger.w(
      '❌ [HTTP ERROR] ${err.response?.statusCode ?? 'NO_STATUS'} ${err.requestOptions.uri}\n'
      'Type: ${err.type}\n'
      'Message: ${err.message}\n'
      'Response: ${err.response?.data}',
    );
    handler.next(err);
  }

  Map<String, dynamic> _sanitizeHeaders(Map<String, dynamic> headers) {
    final copy = Map<String, dynamic>.from(headers);
    if (copy.containsKey('Authorization')) {
      copy['Authorization'] = 'Bearer [REDACTED]';
    }
    return copy;
  }

  dynamic _sanitizeBody(dynamic data) {
    if (data is Map<String, dynamic>) {
      final copy = Map<String, dynamic>.from(data);
      if (copy.containsKey('password')) copy['password'] = '[REDACTED]';
      if (copy.containsKey('paymentToken')) copy['paymentToken'] = '[REDACTED]';
      return copy;
    }
    return data;
  }

  String _truncate(dynamic data) {
    final str = data.toString();
    return str.length > 500 ? '${str.substring(0, 500)}... [truncated]' : str;
  }
}

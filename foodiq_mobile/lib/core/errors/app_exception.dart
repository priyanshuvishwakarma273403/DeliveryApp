class AppException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  AppException({required this.message, this.statusCode, this.details});

  @override
  String toString() => 'AppException: $message (Status: $statusCode)';
}

class NetworkException extends AppException {
  NetworkException({super.message = 'No internet connection. Please check your network.', super.statusCode});
}

class ServerException extends AppException {
  ServerException({required super.message, super.statusCode, super.details});
}

class UnauthorizedException extends AppException {
  UnauthorizedException({super.message = 'Session expired. Please log in again.', super.statusCode = 401});
}

class ForbiddenException extends AppException {
  ForbiddenException({super.message = 'You do not have permission to access this resource.', super.statusCode = 403});
}

class NotFoundException extends AppException {
  NotFoundException({super.message = 'Requested resource not found.', super.statusCode = 404});
}

class ValidationException extends AppException {
  ValidationException({required super.message, super.statusCode = 400, super.details});
}

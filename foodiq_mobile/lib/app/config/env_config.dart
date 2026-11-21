import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvConfig {
  static String get apiBaseUrl {
    return dotenv.env['API_BASE_URL'] ?? 'https://deliveryapp-wwx8.onrender.com/api';
  }

  static String get webSocketUrl {
    return dotenv.env['WEBSOCKET_URL'] ?? 'wss://deliveryapp-wwx8.onrender.com/api/ws/websocket';
  }

  static String get environment {
    return dotenv.env['ENVIRONMENT'] ?? 'production';
  }

  static int get connectTimeout {
    final timeout = dotenv.env['CONNECT_TIMEOUT'];
    return timeout != null ? int.tryParse(timeout) ?? 20000 : 20000;
  }

  static int get receiveTimeout {
    final timeout = dotenv.env['RECEIVE_TIMEOUT'];
    return timeout != null ? int.tryParse(timeout) ?? 25000 : 25000;
  }
}

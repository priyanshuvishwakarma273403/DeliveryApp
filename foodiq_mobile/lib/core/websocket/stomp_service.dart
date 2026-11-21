import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/config/app_constants.dart';
import 'package:foodiq_mobile/app/config/env_config.dart';
import 'package:foodiq_mobile/bootstrap.dart';
import 'package:foodiq_mobile/core/storage/secure_storage_service.dart';
import 'package:foodiq_mobile/core/websocket/websocket_state.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';

final stompServiceProvider = Provider<StompService>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  return StompService(secureStorage);
});

class StompService {
  final SecureStorageService _secureStorage;
  StompClient? _client;
  final Map<String, StompUnsubscribe> _activeSubscriptions = {};

  StompService(this._secureStorage);

  bool get isConnected => _client?.connected ?? false;

  Future<void> connect({Function()? onConnect}) async {
    final token = await _secureStorage.read(AppConstants.tokenKey);

    _client = StompClient(
      config: StompConfig(
        url: EnvConfig.webSocketUrl,
        onConnect: (frame) {
          logger.i('🔌 [STOMP Connected] Frame: ${frame.command}');
          onConnect?.call();
        },
        onWebSocketError: (error) {
          logger.w('⚠️ [STOMP WS Error] $error');
        },
        onStompError: (frame) {
          logger.e('❌ [STOMP Error Frame] ${frame.body}');
        },
        onDisconnect: (frame) {
          logger.i('🔌 [STOMP Disconnected]');
          _activeSubscriptions.clear();
        },
        stompConnectHeaders: {
          if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        webSocketConnectHeaders: {
          if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        },
        reconnectDelay: const Duration(seconds: 4),
      ),
    );

    _client?.activate();
  }

  void subscribe(String destination, Function(Map<String, dynamic> data) onMessage) {
    if (_client == null || !_client!.connected) {
      logger.w('Cannot subscribe to $destination: STOMP client not connected');
      return;
    }

    if (_activeSubscriptions.containsKey(destination)) {
      _activeSubscriptions[destination]?.call();
    }

    final unsubscribe = _client!.subscribe(
      destination: destination,
      callback: (frame) {
        if (frame.body != null) {
          try {
            final json = jsonDecode(frame.body!);
            onMessage(json);
          } catch (e) {
            logger.e('Failed to parse WS JSON from $destination: $e');
          }
        }
      },
    );

    _activeSubscriptions[destination] = unsubscribe;
  }

  void unsubscribe(String destination) {
    if (_activeSubscriptions.containsKey(destination)) {
      _activeSubscriptions[destination]?.call();
      _activeSubscriptions.remove(destination);
    }
  }

  void send(String destination, Map<String, dynamic> body) {
    if (_client != null && _client!.connected) {
      _client!.send(
        destination: destination,
        body: jsonEncode(body),
      );
    }
  }

  void disconnect() {
    for (final unsubscribe in _activeSubscriptions.values) {
      unsubscribe.call();
    }
    _activeSubscriptions.clear();
    _client?.deactivate();
  }
}

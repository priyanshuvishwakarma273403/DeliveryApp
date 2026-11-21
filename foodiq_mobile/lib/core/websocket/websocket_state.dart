enum WebSocketStatus {
  disconnected,
  connecting,
  connected,
  reconnecting,
  error,
}

class WebSocketState {
  final WebSocketStatus status;
  final String? errorMessage;
  final DateTime lastConnected;

  const WebSocketState({
    this.status = WebSocketStatus.disconnected,
    this.errorMessage,
    required this.lastConnected,
  });

  bool get isConnected => status == WebSocketStatus.connected;
}

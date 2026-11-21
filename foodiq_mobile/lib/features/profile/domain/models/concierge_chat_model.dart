class ConciergeChatMessage {
  final String id;
  final String sender; // 'user' or 'concierge'
  final String text;
  final DateTime timestamp;

  const ConciergeChatMessage({
    required this.id,
    required this.sender,
    required this.text,
    required this.timestamp,
  });

  bool get isUser => sender == 'user';

  factory ConciergeChatMessage.fromJson(Map<String, dynamic> json) {
    return ConciergeChatMessage(
      id: json['id']?.toString() ?? '',
      sender: json['sender'] ?? 'concierge',
      text: json['text'] ?? json['message'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

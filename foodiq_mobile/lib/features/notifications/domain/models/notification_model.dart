class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type;
  final String event;
  final bool isRead;
  final bool isPinned;
  final DateTime timestamp;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    this.type = 'INFO',
    this.event = 'ORDER',
    this.isRead = false,
    this.isPinned = false,
    required this.timestamp,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? 'Notification',
      body: json['body'] ?? '',
      type: json['type'] ?? 'INFO',
      event: json['event'] ?? 'GENERAL',
      isRead: json['isRead'] ?? json['read'] ?? false,
      isPinned: json['isPinned'] ?? false,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      title: title,
      body: body,
      type: type,
      event: event,
      isRead: isRead ?? this.isRead,
      isPinned: isPinned,
      timestamp: timestamp,
    );
  }
}

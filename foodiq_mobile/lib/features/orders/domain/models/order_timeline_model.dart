class OrderTimelineModel {
  final int id;
  final int orderId;
  final String title;
  final String description;
  final String eventType;
  final bool customerVisible;
  final DateTime? timestamp;

  const OrderTimelineModel({
    required this.id,
    required this.orderId,
    required this.title,
    required this.description,
    required this.eventType,
    this.customerVisible = true,
    this.timestamp,
  });

  factory OrderTimelineModel.fromJson(Map<String, dynamic> json) {
    return OrderTimelineModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '') ?? 0,
      orderId: json['orderId'] is int
          ? json['orderId']
          : int.tryParse(json['orderId']?.toString() ?? '') ?? 0,
      title: json['title'] ?? 'Milestone',
      description: json['description'] ?? '',
      eventType: json['eventType'] ?? 'INFO',
      customerVisible: json['customerVisible'] ?? true,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString())
          : null,
    );
  }
}

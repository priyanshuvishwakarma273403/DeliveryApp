class RiderLocationModel {
  final int orderId;
  final double latitude;
  final double longitude;
  final double? speed;
  final double? heading;
  final DateTime timestamp;

  const RiderLocationModel({
    required this.orderId,
    required this.latitude,
    required this.longitude,
    this.speed,
    this.heading,
    required this.timestamp,
  });

  factory RiderLocationModel.fromJson(Map<String, dynamic> json) {
    return RiderLocationModel(
      orderId: json['orderId'] is int
          ? json['orderId']
          : int.tryParse(json['orderId']?.toString() ?? '') ?? 0,
      latitude: (json['latitude'] is num) ? (json['latitude'] as num).toDouble() : 28.6139,
      longitude: (json['longitude'] is num) ? (json['longitude'] as num).toDouble() : 77.2090,
      speed: (json['speed'] is num) ? (json['speed'] as num).toDouble() : null,
      heading: (json['heading'] is num) ? (json['heading'] as num).toDouble() : null,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'latitude': latitude,
      'longitude': longitude,
      'speed': speed,
      'heading': heading,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

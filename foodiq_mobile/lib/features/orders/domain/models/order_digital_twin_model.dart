class OrderDigitalTwinModel {
  final int orderId;
  final String restaurantStatus;
  final double kitchenProgress;
  final DateTime? predictedFoodReadyAt;
  final String riderStatus;
  final DateTime? predictedDeliveryAt;
  final String slaRisk;
  final String delayRisk;
  final String overallHealth;

  const OrderDigitalTwinModel({
    required this.orderId,
    this.restaurantStatus = 'ACCEPTED',
    this.kitchenProgress = 0.0,
    this.predictedFoodReadyAt,
    this.riderStatus = 'UNASSIGNED',
    this.predictedDeliveryAt,
    this.slaRisk = 'LOW',
    this.delayRisk = 'NONE',
    this.overallHealth = 'HEALTHY',
  });

  bool get isDelayed => delayRisk == 'CRITICAL' || delayRisk == 'HIGH';
  bool get isHealthy => overallHealth == 'HEALTHY';

  factory OrderDigitalTwinModel.fromJson(Map<String, dynamic> json) {
    return OrderDigitalTwinModel(
      orderId: json['orderId'] is int
          ? json['orderId']
          : int.tryParse(json['orderId']?.toString() ?? '') ?? 0,
      restaurantStatus: json['restaurantStatus'] ?? 'ACCEPTED',
      kitchenProgress: (json['kitchenProgress'] is num)
          ? (json['kitchenProgress'] as num).toDouble()
          : 0.0,
      predictedFoodReadyAt: json['predictedFoodReadyAt'] != null
          ? DateTime.tryParse(json['predictedFoodReadyAt'].toString())
          : null,
      riderStatus: json['riderStatus'] ?? 'UNASSIGNED',
      predictedDeliveryAt: json['predictedDeliveryAt'] != null
          ? DateTime.tryParse(json['predictedDeliveryAt'].toString())
          : null,
      slaRisk: json['slaRisk'] ?? 'LOW',
      delayRisk: json['delayRisk'] ?? 'NONE',
      overallHealth: json['overallHealth'] ?? 'HEALTHY',
    );
  }
}

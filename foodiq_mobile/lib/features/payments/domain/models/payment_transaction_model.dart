class PaymentTransactionModel {
  final String id;
  final String orderId;
  final String customerId;
  final String restaurantId;
  final double amount;
  final double walletDeductionAmount;
  final String paymentMethod;
  final String gatewayName;
  final String status;
  final String? gatewayTransactionId;
  final DateTime timestamp;

  const PaymentTransactionModel({
    required this.id,
    required this.orderId,
    required this.customerId,
    required this.restaurantId,
    required this.amount,
    this.walletDeductionAmount = 0.0,
    required this.paymentMethod,
    required this.gatewayName,
    required this.status,
    this.gatewayTransactionId,
    required this.timestamp,
  });

  bool get isSuccess => status == 'COMPLETED' || status == 'CAPTURED';

  factory PaymentTransactionModel.fromJson(Map<String, dynamic> json) {
    return PaymentTransactionModel(
      id: json['id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? '',
      customerId: json['customerId']?.toString() ?? '',
      restaurantId: json['restaurantId']?.toString() ?? '',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      walletDeductionAmount: (json['walletDeductionAmount'] is num)
          ? (json['walletDeductionAmount'] as num).toDouble()
          : 0.0,
      paymentMethod: json['paymentMethod'] ?? 'UPI',
      gatewayName: json['gatewayName'] ?? 'RAZORPAY',
      status: json['status'] ?? 'PENDING',
      gatewayTransactionId: json['gatewayTransactionId']?.toString(),
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

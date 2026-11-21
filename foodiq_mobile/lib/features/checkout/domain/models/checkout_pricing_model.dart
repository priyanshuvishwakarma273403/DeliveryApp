class CheckoutPricingModel {
  final double subtotal;
  final double discount;
  final double cgst;
  final double sgst;
  final double packagingCharge;
  final double deliveryCharge;
  final double platformFee;
  final double walletDeduction;
  final double finalAmount;
  final String estimatedDeliveryTime;

  const CheckoutPricingModel({
    required this.subtotal,
    this.discount = 0.0,
    required this.cgst,
    required this.sgst,
    this.packagingCharge = 20.0,
    this.deliveryCharge = 40.0,
    this.platformFee = 5.0,
    this.walletDeduction = 0.0,
    required this.finalAmount,
    this.estimatedDeliveryTime = '25 - 35 mins',
  });

  double get totalTaxes => cgst + sgst;

  factory CheckoutPricingModel.fromJson(Map<String, dynamic> json) {
    return CheckoutPricingModel(
      subtotal: (json['subtotal'] is num) ? (json['subtotal'] as num).toDouble() : 0.0,
      discount: (json['discount'] is num) ? (json['discount'] as num).toDouble() : 0.0,
      cgst: (json['cgst'] is num) ? (json['cgst'] as num).toDouble() : 0.0,
      sgst: (json['sgst'] is num) ? (json['sgst'] as num).toDouble() : 0.0,
      packagingCharge: (json['packagingCharge'] is num)
          ? (json['packagingCharge'] as num).toDouble()
          : 20.0,
      deliveryCharge: (json['deliveryCharge'] is num)
          ? (json['deliveryCharge'] as num).toDouble()
          : 40.0,
      platformFee: (json['platformFee'] is num)
          ? (json['platformFee'] as num).toDouble()
          : 5.0,
      walletDeduction: (json['walletDeduction'] is num)
          ? (json['walletDeduction'] as num).toDouble()
          : 0.0,
      finalAmount: (json['finalAmount'] is num)
          ? (json['finalAmount'] as num).toDouble()
          : 0.0,
      estimatedDeliveryTime: json['estimatedDeliveryTime']?.toString() ?? '25 - 35 mins',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subtotal': subtotal,
      'discount': discount,
      'cgst': cgst,
      'sgst': sgst,
      'packagingCharge': packagingCharge,
      'deliveryCharge': deliveryCharge,
      'platformFee': platformFee,
      'walletDeduction': walletDeduction,
      'finalAmount': finalAmount,
      'estimatedDeliveryTime': estimatedDeliveryTime,
    };
  }
}

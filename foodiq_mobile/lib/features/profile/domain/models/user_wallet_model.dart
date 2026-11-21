class UserWalletModel {
  final int id;
  final int userId;
  final double balance;
  final bool isGoldMember;
  final String currency;

  const UserWalletModel({
    required this.id,
    required this.userId,
    required this.balance,
    this.isGoldMember = false,
    this.currency = 'INR',
  });

  factory UserWalletModel.fromJson(Map<String, dynamic> json) {
    return UserWalletModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '') ?? 0,
      userId: json['userId'] is int ? json['userId'] : int.tryParse(json['userId']?.toString() ?? '') ?? 0,
      balance: (json['balance'] is num) ? (json['balance'] as num).toDouble() : 0.0,
      isGoldMember: json['goldMember'] ?? json['isGoldMember'] ?? false,
      currency: json['currency'] ?? 'INR',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'balance': balance,
      'goldMember': isGoldMember,
      'currency': currency,
    };
  }
}

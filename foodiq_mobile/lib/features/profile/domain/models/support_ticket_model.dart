class SupportTicketModel {
  final String id;
  final String orderId;
  final String issue;
  final String priority;
  final String status;
  final DateTime createdAt;

  const SupportTicketModel({
    required this.id,
    required this.orderId,
    required this.issue,
    this.priority = 'HIGH',
    this.status = 'ACTIVE',
    required this.createdAt,
  });

  factory SupportTicketModel.fromJson(Map<String, dynamic> json) {
    return SupportTicketModel(
      id: json['id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? 'N/A',
      issue: json['issue'] ?? 'Support enquiry',
      priority: json['priority'] ?? 'HIGH',
      status: json['status'] ?? 'ACTIVE',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

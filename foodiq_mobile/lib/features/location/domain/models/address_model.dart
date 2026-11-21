class AddressModel {
  final String id;
  final String label; // Home, Work, Other
  final String addressLine;
  final String city;
  final double latitude;
  final double longitude;
  final bool isDefault;

  const AddressModel({
    required this.id,
    required this.label,
    required this.addressLine,
    required this.city,
    required this.latitude,
    required this.longitude,
    this.isDefault = false,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id']?.toString() ?? '',
      label: json['label'] ?? 'Home',
      addressLine: json['addressLine'] ?? json['address'] ?? '',
      city: json['city'] ?? 'Delhi NCR',
      latitude: (json['latitude'] is num) ? (json['latitude'] as num).toDouble() : 28.6139,
      longitude: (json['longitude'] is num) ? (json['longitude'] as num).toDouble() : 77.2090,
      isDefault: json['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'addressLine': addressLine,
      'city': city,
      'latitude': latitude,
      'longitude': longitude,
      'isDefault': isDefault,
    };
  }

  AddressModel copyWith({
    String? id,
    String? label,
    String? addressLine,
    String? city,
    double? latitude,
    double? longitude,
    bool? isDefault,
  }) {
    return AddressModel(
      id: id ?? this.id,
      label: label ?? this.label,
      addressLine: addressLine ?? this.addressLine,
      city: city ?? this.city,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isDefault: isDefault ?? this.isDefault,
    );
  }
}

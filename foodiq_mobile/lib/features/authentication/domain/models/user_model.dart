enum UserRole {
  customer,
  deliveryPartner,
  restaurantOwner,
  branchManager,
  cashier,
  kitchenStaff,
  supportExecutive,
  moderator,
  admin,
  superAdmin;

  static UserRole fromString(String? role) {
    if (role == null) return UserRole.customer;
    switch (role.toUpperCase().replaceAll('ROLE_', '')) {
      case 'DELIVERY_PARTNER':
      case 'RIDER':
        return UserRole.deliveryPartner;
      case 'RESTAURANT_OWNER':
      case 'OWNER':
        return UserRole.restaurantOwner;
      case 'BRANCH_MANAGER':
      case 'MANAGER':
        return UserRole.branchManager;
      case 'CASHIER':
        return UserRole.cashier;
      case 'KITCHEN_STAFF':
      case 'KITCHEN':
        return UserRole.kitchenStaff;
      case 'SUPPORT_EXECUTIVE':
      case 'SUPPORT':
        return UserRole.supportExecutive;
      case 'MODERATOR':
        return UserRole.moderator;
      case 'ADMIN':
      case 'PLATFORM_ADMIN':
        return UserRole.admin;
      case 'SUPER_ADMIN':
        return UserRole.superAdmin;
      case 'CUSTOMER':
      default:
        return UserRole.customer;
    }
  }

  String toDisplayString() {
    switch (this) {
      case UserRole.deliveryPartner:
        return 'Delivery Partner';
      case UserRole.restaurantOwner:
        return 'Restaurant Owner';
      case UserRole.branchManager:
        return 'Branch Manager';
      case UserRole.cashier:
        return 'Cashier';
      case UserRole.kitchenStaff:
        return 'Kitchen Staff';
      case UserRole.supportExecutive:
        return 'Support Executive';
      case UserRole.moderator:
        return 'Moderator';
      case UserRole.admin:
        return 'Platform Admin';
      case UserRole.superAdmin:
        return 'Super Admin';
      case UserRole.customer:
      default:
        return 'Customer';
    }
  }
}

class UserModel {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final UserRole role;
  final String? address;
  final bool active;
  final DateTime? createdAt;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.address,
    this.active = true,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone']?.toString(),
      role: UserRole.fromString(json['role']?.toString()),
      address: json['address']?.toString(),
      active: json['active'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role.name.toUpperCase(),
      'address': address,
      'active': active,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? name,
    String? phone,
    String? address,
    bool? active,
  }) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      email: email,
      phone: phone ?? this.phone,
      role: role,
      address: address ?? this.address,
      active: active ?? this.active,
      createdAt: createdAt,
    );
  }
}

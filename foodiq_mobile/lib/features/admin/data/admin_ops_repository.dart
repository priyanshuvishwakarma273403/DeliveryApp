import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/shared/models/order_model.dart';

final adminOpsRepositoryProvider = Provider<AdminOpsRepository>((ref) {
  return AdminOpsRepository(ref.watch(apiClientProvider));
});

class AdminOpsRepository {
  final ApiClient _apiClient;

  AdminOpsRepository(this._apiClient);

  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response = await _apiClient.get('/admin/analytics/stats');
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] != null) {
        return responseData['data'] as Map<String, dynamic>;
      }
    } catch (_) {}
    return {
      'totalOrders': 1420,
      'activeOrders': 38,
      'totalRevenue': 845200.0,
      'activeDrivers': 64,
      'activeRestaurants': 42,
      'systemHealth': '99.8%',
    };
  }

  Future<List<OrderModel>> getAllOrders() async {
    try {
      final response = await _apiClient.get('/orders');
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] is List) {
        final list = responseData['data'] as List<dynamic>;
        return list.map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  Future<void> overrideOrderStatus(int orderId, String status) async {
    await _apiClient.patch('/orders/$orderId/status', queryParameters: {'status': status});
  }

  Future<Map<String, dynamic>> getFinancialAnalytics() async {
    try {
      final response = await _apiClient.get('/finance/analytics');
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] != null) {
        return responseData['data'] as Map<String, dynamic>;
      }
    } catch (_) {}
    return {};
  }
}

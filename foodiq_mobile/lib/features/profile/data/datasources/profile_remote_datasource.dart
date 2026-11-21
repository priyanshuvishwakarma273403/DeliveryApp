import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_endpoints.dart';
import 'package:foodiq_mobile/features/profile/domain/models/support_ticket_model.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_taste_dna_model.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_wallet_model.dart';

abstract class ProfileRemoteDataSource {
  Future<UserTasteDnaModel> getTasteDna();
  Future<void> updateTastePreferences(UserTasteDnaModel preferences);
  Future<void> deleteTasteDna();

  Future<UserWalletModel> getWallet(int userId);
  Future<void> subscribeGold(int userId);
  Future<void> redeemGiftCard(String code, String userId);

  Future<List<SupportTicketModel>> getSupportTickets();
  Future<SupportTicketModel> createSupportTicket(String orderId, String type, String description);

  Future<String> sendConciergeMessage(String message);
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final ApiClient _apiClient;

  ProfileRemoteDataSourceImpl(this._apiClient);

  @override
  Future<UserTasteDnaModel> getTasteDna() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.userTasteProfile);
      final responseData = response.data;
      if (responseData is Map<String, dynamic>) {
        final data = responseData['data'] ?? responseData;
        return UserTasteDnaModel.fromJson(data as Map<String, dynamic>);
      }
    } catch (_) {}
    return const UserTasteDnaModel();
  }

  @override
  Future<void> updateTastePreferences(UserTasteDnaModel preferences) async {
    await _apiClient.post(
      '/v1/users/me/preferences',
      data: {
        'preferredCuisines': preferences.preferredCuisines,
        'dietaryPreferences': preferences.dietaryPreferences,
        'excludedIngredients': preferences.excludedIngredients,
        'budgetTier': preferences.budgetTier,
      },
    );
  }

  @override
  Future<void> deleteTasteDna() async {
    await _apiClient.delete('/v1/users/me/taste-data');
  }

  @override
  Future<UserWalletModel> getWallet(int userId) async {
    try {
      final response = await _apiClient.get(ApiEndpoints.walletByUserId(userId));
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] != null) {
        final data = responseData['data'] as Map<String, dynamic>;
        return UserWalletModel.fromJson(data);
      }
    } catch (_) {}
    return UserWalletModel(id: 0, userId: userId, balance: 120.0, isGoldMember: false);
  }

  @override
  Future<void> subscribeGold(int userId) async {
    await _apiClient.post(
      ApiEndpoints.subscriptions,
      queryParameters: {
        'userId': userId.toString(),
        'planType': 'GOLD',
        'billingCycle': 'YEARLY',
        'price': 499.0,
      },
    );
  }

  @override
  Future<void> redeemGiftCard(String code, String userId) async {
    await _apiClient.post(
      '/finance/giftcards/redeem',
      queryParameters: {'code': code, 'receiverId': userId},
    );
  }

  @override
  Future<List<SupportTicketModel>> getSupportTickets() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.supportTickets);
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] is List) {
        final list = responseData['data'] as List<dynamic>;
        return list
            .map((item) => SupportTicketModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  @override
  Future<SupportTicketModel> createSupportTicket(String orderId, String type, String description) async {
    final response = await _apiClient.post(
      ApiEndpoints.supportTickets,
      data: {
        'orderId': orderId,
        'type': type,
        'description': description,
      },
    );
    final responseData = response.data;
    if (responseData is Map<String, dynamic> && responseData['data'] != null) {
      final data = responseData['data'] as Map<String, dynamic>;
      return SupportTicketModel.fromJson(data);
    }
    return SupportTicketModel(
      id: 'TKT-${DateTime.now().millisecondsSinceEpoch % 10000}',
      orderId: orderId,
      issue: '$type: $description',
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<String> sendConciergeMessage(String message) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.aiChat,
        data: {'message': message},
      );
      final responseData = response.data;
      if (responseData is Map<String, dynamic> && responseData['data'] != null) {
        return responseData['data'].toString();
      }
    } catch (_) {}
    return "I'm your FoodIQ AI Concierge! I can help you discover perfect meals tailored to your taste DNA and budget.";
  }
}

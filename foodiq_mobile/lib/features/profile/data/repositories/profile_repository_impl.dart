import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/features/profile/data/datasources/profile_remote_datasource.dart';
import 'package:foodiq_mobile/features/profile/domain/models/support_ticket_model.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_taste_dna_model.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_wallet_model.dart';
import 'package:foodiq_mobile/features/profile/domain/repositories/profile_repository.dart';

final profileRemoteDataSourceProvider = Provider<ProfileRemoteDataSource>((ref) {
  return ProfileRemoteDataSourceImpl(ref.watch(apiClientProvider));
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl(ref.watch(profileRemoteDataSourceProvider));
});

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource _remoteDataSource;

  ProfileRepositoryImpl(this._remoteDataSource);

  @override
  Future<UserTasteDnaModel> getTasteDna() async {
    return await _remoteDataSource.getTasteDna();
  }

  @override
  Future<void> updateTastePreferences(UserTasteDnaModel preferences) async {
    await _remoteDataSource.updateTastePreferences(preferences);
  }

  @override
  Future<void> deleteTasteDna() async {
    await _remoteDataSource.deleteTasteDna();
  }

  @override
  Future<UserWalletModel> getWallet(int userId) async {
    return await _remoteDataSource.getWallet(userId);
  }

  @override
  Future<void> subscribeGold(int userId) async {
    await _remoteDataSource.subscribeGold(userId);
  }

  @override
  Future<void> redeemGiftCard(String code, String userId) async {
    await _remoteDataSource.redeemGiftCard(code, userId);
  }

  @override
  Future<List<SupportTicketModel>> getSupportTickets() async {
    return await _remoteDataSource.getSupportTickets();
  }

  @override
  Future<SupportTicketModel> createSupportTicket({
    required String orderId,
    required String type,
    required String description,
  }) async {
    return await _remoteDataSource.createSupportTicket(orderId, type, description);
  }

  @override
  Future<String> sendConciergeMessage(String message) async {
    return await _remoteDataSource.sendConciergeMessage(message);
  }
}

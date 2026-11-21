import 'package:foodiq_mobile/features/profile/domain/models/concierge_chat_model.dart';
import 'package:foodiq_mobile/features/profile/domain/models/support_ticket_model.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_taste_dna_model.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_wallet_model.dart';

abstract class ProfileRepository {
  Future<UserTasteDnaModel> getTasteDna();
  Future<void> updateTastePreferences(UserTasteDnaModel preferences);
  Future<void> deleteTasteDna();

  Future<UserWalletModel> getWallet(int userId);
  Future<void> subscribeGold(int userId);
  Future<void> redeemGiftCard(String code, String userId);

  Future<List<SupportTicketModel>> getSupportTickets();
  Future<SupportTicketModel> createSupportTicket({
    required String orderId,
    required String type,
    required String description,
  });

  Future<String> sendConciergeMessage(String message);
}

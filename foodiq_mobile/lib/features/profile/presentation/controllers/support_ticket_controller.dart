import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/profile/data/repositories/profile_repository_impl.dart';
import 'package:foodiq_mobile/features/profile/domain/models/support_ticket_model.dart';

final supportTicketsProvider =
    AsyncNotifierProvider<SupportTicketsNotifier, List<SupportTicketModel>>(
  SupportTicketsNotifier.new,
);

class SupportTicketsNotifier extends AsyncNotifier<List<SupportTicketModel>> {
  @override
  Future<List<SupportTicketModel>> build() async {
    final repo = ref.watch(profileRepositoryProvider);
    return await repo.getSupportTickets();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(profileRepositoryProvider);
      return await repo.getSupportTickets();
    });
  }

  Future<bool> createTicket({
    required String orderId,
    required String type,
    required String description,
  }) async {
    try {
      final repo = ref.read(profileRepositoryProvider);
      final newTicket = await repo.createSupportTicket(
        orderId: orderId,
        type: type,
        description: description,
      );

      final current = state.value ?? [];
      state = AsyncValue.data([newTicket, ...current]);
      return true;
    } catch (_) {
      return false;
    }
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/profile/data/repositories/profile_repository_impl.dart';
import 'package:foodiq_mobile/features/profile/domain/models/concierge_chat_model.dart';
import 'package:foodiq_mobile/features/profile/domain/repositories/profile_repository.dart';

class ConciergeChatState {
  final List<ConciergeChatMessage> messages;
  final bool isThinking;

  const ConciergeChatState({
    this.messages = const [],
    this.isThinking = false,
  });

  ConciergeChatState copyWith({
    List<ConciergeChatMessage>? messages,
    bool? isThinking,
  }) {
    return ConciergeChatState(
      messages: messages ?? this.messages,
      isThinking: isThinking ?? this.isThinking,
    );
  }
}

final foodConciergeControllerProvider =
    StateNotifierProvider<FoodConciergeController, ConciergeChatState>((ref) {
  final repository = ref.watch(profileRepositoryProvider);
  return FoodConciergeController(repository);
});

class FoodConciergeController extends StateNotifier<ConciergeChatState> {
  final ProfileRepository _repository;

  FoodConciergeController(this._repository)
      : super(ConciergeChatState(messages: [
          ConciergeChatMessage(
            id: '1',
            sender: 'concierge',
            text: 'Hello! I am your FoodIQ AI Food Concierge. Ask me anything like "Craving something spicy under ₹300" or "Healthy high-protein dinner options nearby"!',
            timestamp: DateTime.now(),
          ),
        ]));

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final userMsg = ConciergeChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isThinking: true,
    );

    try {
      final aiReply = await _repository.sendConciergeMessage(text);
      final replyMsg = ConciergeChatMessage(
        id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
        sender: 'concierge',
        text: aiReply,
        timestamp: DateTime.now(),
      );

      state = state.copyWith(
        messages: [...state.messages, replyMsg],
        isThinking: false,
      );
    } catch (e) {
      final errorMsg = ConciergeChatMessage(
        id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
        sender: 'concierge',
        text: "I encountered an issue getting suggestions right now. Try exploring our curated collections on the Home feed!",
        timestamp: DateTime.now(),
      );

      state = state.copyWith(
        messages: [...state.messages, errorMsg],
        isThinking: false,
      );
    }
  }
}

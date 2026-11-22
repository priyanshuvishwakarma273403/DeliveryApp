import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/features/profile/presentation/controllers/food_concierge_controller.dart';

class FoodConciergeChatScreen extends ConsumerStatefulWidget {
  const FoodConciergeChatScreen({super.key});

  @override
  ConsumerState<FoodConciergeChatScreen> createState() => _FoodConciergeChatScreenState();
}

class _FoodConciergeChatScreenState extends ConsumerState<FoodConciergeChatScreen> {
  final TextEditingController _textController = TextEditingController();

  final List<String> _quickPrompts = [
    'Spicy Biryani under ₹300',
    'Healthy high-protein lunch',
    'Best South Indian breakfast',
    'Late night dessert cravings',
  ];

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _send(String message) {
    if (message.trim().isEmpty) return;
    ref.read(foodConciergeControllerProvider.notifier).sendMessage(message);
    _textController.clear();
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(foodConciergeControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, color: AppColors.accentOrange, size: 20),
            SizedBox(width: 8),
            Text('FoodIQ AI Concierge', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Quick Prompts Bar
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _quickPrompts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final prompt = _quickPrompts[index];
                return ActionChip(
                  label: Text(prompt, style: const TextStyle(fontSize: 11)),
                  onPressed: () => _send(prompt),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // Messages List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: chatState.messages.length,
              itemBuilder: (context, index) {
                final msg = chatState.messages[index];
                return Align(
                  alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.78,
                    ),
                    decoration: BoxDecoration(
                      color: msg.isUser
                          ? AppColors.primaryRed
                          : AppColors.cardBackground(Theme.of(context).brightness),
                      borderRadius: BorderRadius.circular(14),
                      border: msg.isUser
                          ? null
                          : Border.all(color: Colors.grey.withOpacity(0.18)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      msg.text,
                      style: TextStyle(
                        fontSize: 13,
                        color: msg.isUser ? Colors.white : null,
                        height: 1.35,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          if (chatState.isThinking)
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 8),
                  Text('FoodIQ Concierge is thinking...', style: TextStyle(fontSize: 11, color: Colors.grey)),
                ],
              ),
            ),

          // Message Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.withOpacity(0.15))),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      onSubmitted: _send,
                      decoration: const InputDecoration(
                        hintText: 'Ask for cravings, dishes, budget...',
                        hintStyle: TextStyle(fontSize: 13, color: AppColors.neutralGray),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.send_rounded, color: AppColors.primaryRed),
                    onPressed: () => _send(_textController.text),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';

class ScratchCardDialog extends StatefulWidget {
  final int coinsEarned;
  final VoidCallback onDismiss;

  const ScratchCardDialog({
    super.key,
    required this.coinsEarned,
    required this.onDismiss,
  });

  @override
  State<ScratchCardDialog> createState() => _ScratchCardDialogState();
}

class _ScratchCardDialogState extends State<ScratchCardDialog> {
  bool _isRevealed = false;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.celebration, color: AppColors.accentOrange, size: 48),
            const SizedBox(height: 12),
            const Text(
              'Order Placed Successfully!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'You have unlocked a FoodIQ Reward!',
              style: TextStyle(fontSize: 13, color: AppColors.neutralGray),
            ),
            const SizedBox(height: 20),

            // Scratch Card Surface
            GestureDetector(
              onTap: () {
                if (!_isRevealed) {
                  setState(() => _isRevealed = true);
                }
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                width: 220,
                height: 140,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: _isRevealed
                      ? const LinearGradient(
                          colors: [Color(0xFFFFF8E1), Color(0xFFFFECB3)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : const LinearGradient(
                          colors: [AppColors.primaryRed, AppColors.accentOrange],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: _isRevealed
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.monetization_on, color: Colors.amber, size: 36),
                          const SizedBox(height: 6),
                          Text(
                            '+${widget.coinsEarned} Coins',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFE65100),
                            ),
                          ),
                          const Text(
                            'Added to your FoodIQ Wallet',
                            style: TextStyle(fontSize: 10, color: Color(0xFF795548)),
                          ),
                        ],
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.touch_app, color: Colors.white, size: 32),
                          SizedBox(height: 8),
                          Text(
                            'Tap to Scratch & Reveal',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: widget.onDismiss,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Track Live Order', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

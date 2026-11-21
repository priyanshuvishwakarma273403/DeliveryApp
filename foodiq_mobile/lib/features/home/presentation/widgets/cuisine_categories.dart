import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';

class CuisineCategoriesBar extends StatelessWidget {
  final void Function(String cuisine) onSelectCuisine;

  const CuisineCategoriesBar({super.key, required this.onSelectCuisine});

  static const List<({String name, String emoji})> _cuisines = [
    (name: 'Biryani', emoji: '🍛'),
    (name: 'Pizza', emoji: '🍕'),
    (name: 'Burger', emoji: '🍔'),
    (name: 'Rolls', emoji: '🌯'),
    (name: 'North Indian', emoji: '🍲'),
    (name: 'Chinese', emoji: '🍜'),
    (name: 'South Indian', emoji: '🥞'),
    (name: 'Desserts', emoji: '🍨'),
    (name: 'Healthy', emoji: '🥗'),
    (name: 'Thali', emoji: '🍱'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("WHAT'S ON YOUR MIND?", style: AppTypography.labelSmall()),
              Text('See All', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 98,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _cuisines.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final c = _cuisines[index];
              return InkWell(
                onTap: () => onSelectCuisine(c.name),
                borderRadius: BorderRadius.circular(40),
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.borderLight),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(c.emoji, style: const TextStyle(fontSize: 28)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      c.name,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

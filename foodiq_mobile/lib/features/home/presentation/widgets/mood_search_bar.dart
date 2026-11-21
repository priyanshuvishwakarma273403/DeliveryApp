import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';

class MoodSearchBar extends StatelessWidget {
  final void Function(String mood) onSelectMood;

  const MoodSearchBar({super.key, required this.onSelectMood});

  static const List<({String title, String emoji, Color color})> _moods = [
    (title: 'Late Night Cravings', emoji: '🌙', color: Colors.indigo),
    (title: 'Healthy Detox', emoji: '🥑', color: AppColors.success),
    (title: 'Comfort Food', emoji: '🍜', color: AppColors.secondary),
    (title: 'Sweet Tooth', emoji: '🍩', color: Colors.pink),
    (title: 'Weekend Party', emoji: '🎉', color: Colors.deepPurple),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            children: [
              const Icon(Icons.auto_awesome_rounded, size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Text('AI MOOD DISCOVERY', style: AppTypography.labelSmall()),
            ],
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 42,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _moods.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final m = _moods[index];
              return InkWell(
                onTap: () => onSelectMood(m.title),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: m.color.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: m.color.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      Text(m.emoji, style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 6),
                      Text(
                        m.title,
                        style: TextStyle(
                          color: m.color,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

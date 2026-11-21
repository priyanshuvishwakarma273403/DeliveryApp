import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';

class StoriesBar extends StatelessWidget {
  const StoriesBar({super.key});

  static const List<({String title, String image})> _stories = [
    (title: 'Spicy Treats', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'),
    (title: 'New Cafes', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=80'),
    (title: 'Top Desserts', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&q=80'),
    (title: 'Gold Deals', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80'),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 90,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _stories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final s = _stories[index];
          return Column(
            children: [
              Container(
                padding: const EdgeInsets.all(2.5),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.secondary],
                  ),
                  shape: BoxShape.circle,
                ),
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: CircleAvatar(
                    radius: 26,
                    backgroundImage: NetworkImage(s.image),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                s.title,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
              ),
            ],
          );
        },
      ),
    );
  }
}

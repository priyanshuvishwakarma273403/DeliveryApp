import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/app_card.dart';
import 'package:foodiq_mobile/features/home/domain/models/home_feed_model.dart';

class HomeRecommendationsSection extends StatelessWidget {
  final List<HomeRecommendationItem> recommendations;
  final void Function(HomeRecommendationItem item) onItemTap;

  const HomeRecommendationsSection({
    super.key,
    required this.recommendations,
    required this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    if (recommendations.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            children: [
              const Icon(Icons.auto_awesome, size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Text('RECOMMENDED FOR YOUR TASTE', style: AppTypography.labelSmall()),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 195,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: recommendations.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final item = recommendations[index];
              return InkWell(
                onTap: () => onItemTap(item),
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: 150,
                  child: AppCard(
                    padding: EdgeInsets.zero,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          child: CachedNetworkImage(
                            imageUrl: item.imageUrl ??
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
                            height: 100,
                            width: 150,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                CurrencyFormatter.format(item.price),
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
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

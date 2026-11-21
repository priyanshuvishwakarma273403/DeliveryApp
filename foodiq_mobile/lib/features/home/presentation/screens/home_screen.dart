import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/error_view.dart';
import 'package:foodiq_mobile/core/widgets/loading_skeleton.dart';
import 'package:foodiq_mobile/features/home/data/repositories/home_repository_impl.dart';
import 'package:foodiq_mobile/features/home/presentation/widgets/cuisine_categories.dart';
import 'package:foodiq_mobile/features/home/presentation/widgets/hero_carousel.dart';
import 'package:foodiq_mobile/features/home/presentation/widgets/home_recommendations_section.dart';
import 'package:foodiq_mobile/features/home/presentation/widgets/mood_search_bar.dart';
import 'package:foodiq_mobile/features/home/presentation/widgets/offer_slider.dart';
import 'package:foodiq_mobile/features/home/presentation/widgets/stories_bar.dart';
import 'package:foodiq_mobile/features/restaurants/domain/models/restaurant_filter.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/controllers/restaurant_list_controller.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/widgets/restaurant_card.dart';

class HomeScreen extends ConsumerWidget {
  final VoidCallback onSearchTap;

  const HomeScreen({super.key, required this.onSearchTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeFeedAsync = ref.watch(homeFeedProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(homeFeedProvider);
      },
      child: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          const SizedBox(height: 12),
          // Stories
          const StoriesBar(),
          const SizedBox(height: 16),

          // Hero Banner Theme Carousel
          HeroCarousel(onSearchTap: onSearchTap),
          const SizedBox(height: 20),

          // FoodIQ Gold Offer Strip
          const OfferSlider(),
          const SizedBox(height: 24),

          // Cuisine Categories
          CuisineCategoriesBar(
            onSelectCuisine: (cuisine) {
              ref.read(restaurantFilterProvider.notifier).state =
                  RestaurantFilter(cuisine: cuisine);
              context.push('/restaurants');
            },
          ),
          const SizedBox(height: 24),

          // AI Mood Discovery
          MoodSearchBar(
            onSelectMood: (mood) {
              onSearchTap();
            },
          ),
          const SizedBox(height: 24),

          // Dynamic Feed Data (Recommendations & Top Restaurants)
          homeFeedAsync.when(
            data: (feed) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (feed.recommendations.isNotEmpty) ...[
                  HomeRecommendationsSection(
                    recommendations: feed.recommendations,
                    onItemTap: (item) {},
                  ),
                  const SizedBox(height: 24),
                ],
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('TOP RATED RESTAURANTS', style: AppTypography.labelSmall()),
                      GestureDetector(
                        onTap: () => context.push('/restaurants'),
                        child: const Text(
                          'View All',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: feed.topRestaurants.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final restaurant = feed.topRestaurants[index];
                    return RestaurantCard(
                      restaurant: restaurant,
                      onTap: () => context.push('/restaurants/${restaurant.id}'),
                    );
                  },
                ),
              ],
            ),
            loading: () => Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: List.generate(
                  3,
                  (_) => const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: LoadingSkeleton(width: double.infinity, height: 220),
                  ),
                ),
              ),
            ),
            error: (err, _) => ErrorView(
              message: err.toString(),
              onRetry: () => ref.invalidate(homeFeedProvider),
            ),
          ),
        ],
      ),
    );
  }
}

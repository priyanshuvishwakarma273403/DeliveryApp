import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/empty_state_view.dart';
import 'package:foodiq_mobile/core/widgets/error_view.dart';
import 'package:foodiq_mobile/core/widgets/loading_skeleton.dart';
import 'package:foodiq_mobile/features/restaurants/domain/models/restaurant_filter.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/controllers/restaurant_list_controller.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/widgets/restaurant_card.dart';

class RestaurantListScreen extends ConsumerWidget {
  const RestaurantListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final restaurantsAsync = ref.watch(restaurantListProvider);
    final filter = ref.watch(restaurantFilterProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Restaurants'),
      ),
      body: Column(
        children: [
          // Filter Chips Bar
          _buildFilterBar(context, ref, filter),
          Expanded(
            child: restaurantsAsync.when(
              data: (restaurants) {
                if (restaurants.isEmpty) {
                  return EmptyStateView(
                    icon: Icons.search_off_rounded,
                    title: 'No Restaurants Found',
                    description: 'Try adjusting your filters or search keywords.',
                    buttonText: 'Reset Filters',
                    onButtonPressed: () {
                      ref.read(restaurantFilterProvider.notifier).state = const RestaurantFilter();
                    },
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(restaurantListProvider);
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: restaurants.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final restaurant = restaurants[index];
                      return RestaurantCard(
                        restaurant: restaurant,
                        onTap: () => context.push('/restaurants/${restaurant.id}'),
                      );
                    },
                  ),
                );
              },
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 4,
                separatorBuilder: (_, __) => const SizedBox(height: 16),
                itemBuilder: (_, __) => const LoadingSkeleton(width: double.infinity, height: 240, borderRadius: 18),
              ),
              error: (err, _) => ErrorView(
                message: err.toString(),
                onRetry: () => ref.invalidate(restaurantListProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar(BuildContext context, WidgetRef ref, RestaurantFilter filter) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          FilterChip(
            label: const Text('Pure Veg'),
            selected: filter.isVegOnly ?? false,
            onSelected: (val) {
              ref.read(restaurantFilterProvider.notifier).state =
                  filter.copyWith(isVegOnly: val ? true : null);
            },
          ),
          const SizedBox(width: 8),
          FilterChip(
            label: const Text('Rating 4.0+'),
            selected: (filter.minRating ?? 0) >= 4.0,
            onSelected: (val) {
              ref.read(restaurantFilterProvider.notifier).state =
                  filter.copyWith(minRating: val ? 4.0 : null);
            },
          ),
          const SizedBox(width: 8),
          FilterChip(
            label: const Text('Fast Delivery (< 30m)'),
            selected: (filter.maxDeliveryMinutes ?? 0) == 30,
            onSelected: (val) {
              ref.read(restaurantFilterProvider.notifier).state =
                  filter.copyWith(maxDeliveryMinutes: val ? 30 : null);
            },
          ),
        ],
      ),
    );
  }
}

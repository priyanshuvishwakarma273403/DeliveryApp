import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/error_view.dart';
import 'package:foodiq_mobile/features/cart/presentation/controllers/cart_controller.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/controllers/restaurant_detail_controller.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/widgets/food_detail_bottom_sheet.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/widgets/food_item_card.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';

class RestaurantDetailScreen extends ConsumerStatefulWidget {
  final String restaurantId;

  const RestaurantDetailScreen({super.key, required this.restaurantId});

  @override
  ConsumerState<RestaurantDetailScreen> createState() => _RestaurantDetailScreenState();
}

class _RestaurantDetailScreenState extends ConsumerState<RestaurantDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final restaurantAsync = ref.watch(restaurantDetailProvider(widget.restaurantId));
    final menuAsync = ref.watch(restaurantMenuProvider(widget.restaurantId));
    final selectedCategory = ref.watch(selectedMenuCategoryProvider);
    final cart = ref.watch(cartControllerProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: restaurantAsync.when(
        data: (restaurant) => CustomScrollView(
          slivers: [
            // App Bar with Banner
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                background: CachedNetworkImage(
                  imageUrl: restaurant.imageUrl ??
                      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
                  fit: BoxFit.cover,
                ),
              ),
            ),
            // Restaurant Header Info
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            restaurant.name,
                            style: AppTypography.headlineMedium(),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppColors.success,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.star_rounded, color: Colors.white, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                restaurant.rating.toStringAsFixed(1),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      restaurant.cuisineType,
                      style: AppTypography.bodyMedium(),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textMutedLight),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            restaurant.address,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.bodySmall(),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 12),
                    Text('MENU CATEGORIES', style: AppTypography.labelSmall()),
                  ],
                ),
              ),
            ),
            // Menu Items List
            menuAsync.when(
              data: (items) {
                // Extract unique categories
                final categories = ['All', ...items.map((e) => e.category).toSet()];

                final filteredItems = selectedCategory == 'All'
                    ? items
                    : items.where((e) => e.category == selectedCategory).toList();

                return SliverMainAxisGroup(
                  slivers: [
                    // Sticky Category Filter Tabs
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 44,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: categories.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            final cat = categories[index];
                            final isSelected = cat == selectedCategory;
                            return ChoiceChip(
                              label: Text(cat),
                              selected: isSelected,
                              selectedColor: AppColors.primary,
                              labelStyle: TextStyle(
                                color: isSelected ? Colors.white : AppColors.textPrimaryLight,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                              onSelected: (_) {
                                ref.read(selectedMenuCategoryProvider.notifier).state = cat;
                              },
                            );
                          },
                        ),
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.all(20),
                      sliver: SliverList.separated(
                        itemCount: filteredItems.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final item = filteredItems[index];
                          final count = cart.getItemQuantity(item.id);

                          return FoodItemCard(
                            item: item,
                            quantity: count,
                            onTap: () {
                              FoodDetailBottomSheet.show(context, item, () {
                                _addItemWithCheck(item, restaurant);
                              });
                            },
                            onAdd: () {
                              _addItemWithCheck(item, restaurant);
                            },
                            onIncrement: () {
                              ref
                                  .read(cartControllerProvider.notifier)
                                  .updateQuantity(item.id, count + 1);
                            },
                            onDecrement: () {
                              ref
                                  .read(cartControllerProvider.notifier)
                                  .updateQuantity(item.id, count - 1);
                            },
                          );
                        },
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 80)),
                  ],
                );
              },
              loading: () => const SliverToBoxAdapter(
                child: Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: CircularProgressIndicator(),
                  ),
                ),
              ),
              error: (err, _) => SliverToBoxAdapter(
                child: Center(child: Text('Failed to load menu: $err')),
              ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(
          message: err.toString(),
          onRetry: () => ref.invalidate(restaurantDetailProvider(widget.restaurantId)),
        ),
      ),
      bottomNavigationBar: cart.isNotEmpty && cart.restaurantId == widget.restaurantId
          ? SafeArea(
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primaryRed,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryRed.withOpacity(0.4),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: InkWell(
                  onTap: () => context.push(RoutePaths.cart),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${cart.totalItems} ${cart.totalItems == 1 ? 'ITEM' : 'ITEMS'}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            CurrencyFormatter.formatINR(cart.subtotal),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const Row(
                        children: [
                          Text(
                            'View Cart',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_forward_ios, color: Colors.white, size: 14),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            )
          : null,
    );
  }

  void _addItemWithCheck(MenuItemModel item, RestaurantModel restaurant) {
    final cart = ref.read(cartControllerProvider);
    if (cart.isNotEmpty && cart.restaurantId != null && cart.restaurantId != restaurant.id) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Replace cart items?'),
          content: Text(
            'Your cart contains items from ${cart.restaurantName ?? 'another restaurant'}. Do you want to discard them and add items from ${restaurant.name}?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryRed),
              onPressed: () {
                Navigator.pop(ctx);
                ref.read(cartControllerProvider.notifier).addItem(
                      menuItem: item,
                      restaurantId: restaurant.id,
                      restaurantName: restaurant.name,
                      forceReplace: true,
                    );
              },
              child: const Text('Replace', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } else {
      ref.read(cartControllerProvider.notifier).addItem(
            menuItem: item,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
          );
    }
  }
}

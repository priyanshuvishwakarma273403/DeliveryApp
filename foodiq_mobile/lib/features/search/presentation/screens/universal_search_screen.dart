import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/utils/currency_formatter.dart';
import 'package:foodiq_mobile/core/widgets/app_card.dart';
import 'package:foodiq_mobile/core/widgets/empty_state_view.dart';
import 'package:foodiq_mobile/features/search/domain/models/search_result_model.dart';
import 'package:foodiq_mobile/features/search/presentation/controllers/search_controller.dart';

class UniversalSearchScreen extends ConsumerStatefulWidget {
  const UniversalSearchScreen({super.key});

  @override
  ConsumerState<UniversalSearchScreen> createState() => _UniversalSearchScreenState();
}

class _UniversalSearchScreenState extends ConsumerState<UniversalSearchScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsets.only(right: 16),
          child: TextField(
            controller: _searchController,
            autofocus: true,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: 'Search restaurants, dishes, cuisines...',
              prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 20),
                      onPressed: () {
                        _searchController.clear();
                        ref.read(searchControllerProvider.notifier).onQueryChanged('');
                      },
                    )
                  : const Icon(Icons.mic_none_rounded, color: AppColors.textMutedLight),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onChanged: (val) {
              ref.read(searchControllerProvider.notifier).onQueryChanged(val);
            },
            onSubmitted: (val) {
              ref.read(searchControllerProvider.notifier).executeSearch(val);
            },
          ),
        ),
      ),
      body: _buildBody(searchState),
    );
  }

  Widget _buildBody(SearchState state) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // 1. Search Results
    if (state.results.isNotEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: state.results.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = state.results[index];
          return _searchResultCard(item);
        },
      );
    }

    // 2. Autocomplete Suggestions
    if (state.suggestions.isNotEmpty) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.suggestions.length,
        itemBuilder: (context, index) {
          final suggestion = state.suggestions[index];
          return ListTile(
            leading: const Icon(Icons.search_rounded, color: AppColors.textMutedLight),
            title: Text(suggestion.query, style: const TextStyle(fontWeight: FontWeight.bold)),
            trailing: const Icon(Icons.north_west_rounded, size: 16, color: AppColors.textMutedLight),
            onTap: () {
              _searchController.text = suggestion.query;
              ref.read(searchControllerProvider.notifier).executeSearch(suggestion.query);
            },
          );
        },
      );
    }

    // 3. Query submitted but 0 results
    if (state.query.trim().isNotEmpty && state.results.isEmpty) {
      return EmptyStateView(
        icon: Icons.search_off_rounded,
        title: 'No Matches for "${state.query}"',
        description: 'Try searching for dishes like Biryani, Pizza, Rolls, or Burger.',
      );
    }

    // 4. Default Search Screen (History & Popular Cuisines)
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        if (state.history.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('RECENT SEARCHES', style: AppTypography.labelSmall()),
              GestureDetector(
                onTap: () => ref.read(searchControllerProvider.notifier).clearHistory(),
                child: const Text('Clear', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: state.history.map((h) {
              return ActionChip(
                avatar: const Icon(Icons.history_rounded, size: 16, color: AppColors.textSecondaryLight),
                label: Text(h, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                backgroundColor: Colors.white,
                onPressed: () {
                  _searchController.text = h;
                  ref.read(searchControllerProvider.notifier).executeSearch(h);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 28),
        ],

        Text('TRENDING DISHES', style: AppTypography.labelSmall()),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ['Hyderabadi Biryani', 'Farmhouse Pizza', 'Butter Chicken', 'Cold Coffee', 'Chole Bhature'].map((t) {
            return ActionChip(
              avatar: const Icon(Icons.trending_up_rounded, size: 16, color: AppColors.primary),
              label: Text(t, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              backgroundColor: Colors.white,
              onPressed: () {
                _searchController.text = t;
                ref.read(searchControllerProvider.notifier).executeSearch(t);
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _searchResultCard(SearchResultItemModel item) {
    return AppCard(
      onTap: () {
        if (item.type == SearchItemType.restaurant) {
          context.push('/restaurants/${item.id}');
        } else if (item.restaurantId != null) {
          context.push('/restaurants/${item.restaurantId}');
        }
      },
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CachedNetworkImage(
              imageUrl: item.imageUrl ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
              width: 60,
              height: 60,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.titleMedium(),
                      ),
                    ),
                    if (item.rating != null) ...[
                      const Icon(Icons.star_rounded, size: 14, color: AppColors.success),
                      const SizedBox(width: 2),
                      Text(
                        item.rating!.toStringAsFixed(1),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  item.subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.bodySmall(),
                ),
                if (item.price != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    CurrencyFormatter.format(item.price),
                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

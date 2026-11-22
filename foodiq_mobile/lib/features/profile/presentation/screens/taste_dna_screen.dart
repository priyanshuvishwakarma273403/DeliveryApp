import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/features/profile/presentation/controllers/taste_dna_controller.dart';

class TasteDnaScreen extends ConsumerWidget {
  const TasteDnaScreen({super.key});

  static const List<String> availableCuisines = [
    'North Indian',
    'South Indian',
    'Chinese',
    'Italian',
    'Biryani',
    'Mughlai',
    'Fast Food',
    'Desserts',
    'Healthy Food',
    'Continental',
  ];

  static const List<String> dietaryOptions = [
    'Pure Vegetarian',
    'Vegan',
    'Jain Meal',
    'Halal',
    'High Protein',
    'Low Carb',
  ];

  static const List<String> allergenOptions = [
    'Dairy / Lactose',
    'Peanuts / Nuts',
    'Gluten / Wheat',
    'Egg',
    'Shellfish / Seafood',
    'Soy',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasteDnaAsync = ref.watch(tasteDnaControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Taste DNA', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(tasteDnaControllerProvider.notifier).savePreferences();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Taste DNA preferences saved!')),
                );
              }
            },
            child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: tasteDnaAsync.when(
        data: (dna) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryRed.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primaryRed.withOpacity(0.2)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.fingerprint, color: AppColors.primaryRed, size: 36),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AI Taste Intelligence',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Your Taste DNA personalizes restaurant feeds, filters out allergens, and suggests smart combos.',
                            style: TextStyle(fontSize: 11, color: AppColors.neutralGray),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Cuisines Multi-selector
              const Text('Favorite Cuisines', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: availableCuisines.map((cuisine) {
                  final isSelected = dna.preferredCuisines.contains(cuisine);
                  return FilterChip(
                    label: Text(cuisine),
                    selected: isSelected,
                    selectedColor: AppColors.primaryRed,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : null,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    onSelected: (_) {
                      ref.read(tasteDnaControllerProvider.notifier).toggleCuisine(cuisine);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Dietary Preferences
              const Text('Dietary Lifestyle', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: dietaryOptions.map((diet) {
                  final isSelected = dna.dietaryPreferences.contains(diet);
                  return FilterChip(
                    label: Text(diet),
                    selected: isSelected,
                    selectedColor: AppColors.vegGreen,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : null,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    onSelected: (_) {
                      ref.read(tasteDnaControllerProvider.notifier).toggleDietary(diet);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Allergen Guardian Exclusions
              Row(
                children: const [
                  Icon(Icons.shield_outlined, color: AppColors.accentOrange, size: 18),
                  SizedBox(width: 6),
                  Text('Allergy Guardian (Excluded Ingredients)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
              const SizedBox(height: 4),
              const Text('Dishes containing these ingredients will show warning banners in your cart.', style: TextStyle(fontSize: 11, color: AppColors.neutralGray)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: allergenOptions.map((allergen) {
                  final isSelected = dna.excludedIngredients.contains(allergen);
                  return FilterChip(
                    label: Text(allergen),
                    selected: isSelected,
                    selectedColor: AppColors.accentOrange,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : null,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    onSelected: (_) {
                      ref.read(tasteDnaControllerProvider.notifier).toggleAllergen(allergen);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 30),

              // Reset / Delete Taste Data
              OutlinedButton(
                onPressed: () async {
                  await ref.read(tasteDnaControllerProvider.notifier).deleteTasteDna();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Taste DNA reset to default')),
                    );
                  }
                },
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red)),
                child: const Text('Reset Taste DNA Data', style: TextStyle(color: Colors.red)),
              ),
              const SizedBox(height: 40),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load Taste DNA: $e')),
      ),
    );
  }
}

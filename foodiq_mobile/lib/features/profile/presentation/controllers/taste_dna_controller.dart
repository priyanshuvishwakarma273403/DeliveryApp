import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/profile/data/repositories/profile_repository_impl.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_taste_dna_model.dart';
import 'package:foodiq_mobile/features/profile/domain/repositories/profile_repository.dart';

final tasteDnaControllerProvider =
    StateNotifierProvider<TasteDnaController, AsyncValue<UserTasteDnaModel>>((ref) {
  final repository = ref.watch(profileRepositoryProvider);
  return TasteDnaController(repository);
});

class TasteDnaController extends StateNotifier<AsyncValue<UserTasteDnaModel>> {
  final ProfileRepository _repository;

  TasteDnaController(this._repository) : super(const AsyncValue.loading()) {
    loadTasteDna();
  }

  Future<void> loadTasteDna() async {
    state = const AsyncValue.loading();
    try {
      final dna = await _repository.getTasteDna();
      state = AsyncValue.data(dna);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void toggleCuisine(String cuisine) {
    state.whenData((current) {
      final list = List<String>.from(current.preferredCuisines);
      if (list.contains(cuisine)) {
        list.remove(cuisine);
      } else {
        list.add(cuisine);
      }
      state = AsyncValue.data(UserTasteDnaModel(
        preferredCuisines: list,
        dietaryPreferences: current.dietaryPreferences,
        excludedIngredients: current.excludedIngredients,
        budgetTier: current.budgetTier,
        spicyScore: current.spicyScore,
        sweetScore: current.sweetScore,
        tangyScore: current.tangyScore,
        healthyScore: current.healthyScore,
        explorationScore: current.explorationScore,
      ));
    });
  }

  void toggleDietary(String pref) {
    state.whenData((current) {
      final list = List<String>.from(current.dietaryPreferences);
      if (list.contains(pref)) {
        list.remove(pref);
      } else {
        list.add(pref);
      }
      state = AsyncValue.data(UserTasteDnaModel(
        preferredCuisines: current.preferredCuisines,
        dietaryPreferences: list,
        excludedIngredients: current.excludedIngredients,
        budgetTier: current.budgetTier,
        spicyScore: current.spicyScore,
        sweetScore: current.sweetScore,
        tangyScore: current.tangyScore,
        healthyScore: current.healthyScore,
        explorationScore: current.explorationScore,
      ));
    });
  }

  void toggleAllergen(String allergen) {
    state.whenData((current) {
      final list = List<String>.from(current.excludedIngredients);
      if (list.contains(allergen)) {
        list.remove(allergen);
      } else {
        list.add(allergen);
      }
      state = AsyncValue.data(UserTasteDnaModel(
        preferredCuisines: current.preferredCuisines,
        dietaryPreferences: current.dietaryPreferences,
        excludedIngredients: list,
        budgetTier: current.budgetTier,
        spicyScore: current.spicyScore,
        sweetScore: current.sweetScore,
        tangyScore: current.tangyScore,
        healthyScore: current.healthyScore,
        explorationScore: current.explorationScore,
      ));
    });
  }

  Future<void> savePreferences() async {
    final current = state.value;
    if (current != null) {
      await _repository.updateTastePreferences(current);
    }
  }

  Future<void> deleteTasteDna() async {
    await _repository.deleteTasteDna();
    state = const AsyncValue.data(UserTasteDnaModel());
  }
}

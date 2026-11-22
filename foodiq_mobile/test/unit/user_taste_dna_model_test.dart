import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_taste_dna_model.dart';

void main() {
  group('UserTasteDnaModel Tests', () {
    test('should parse taste DNA profile JSON correctly', () {
      final json = {
        'profile': {
          'preferredCuisines': ['NORTH_INDIAN', 'MUGHLAI', 'BIRYANI'],
          'dietaryPreferences': ['HIGH_PROTEIN'],
          'excludedIngredients': ['PEANUTS', 'SHELLFISH'],
          'budgetTier': 'MEDIUM',
          'spicyScore': 0.85,
          'sweetScore': 0.3,
          'tangyScore': 0.6,
          'healthyScore': 0.7,
        }
      };

      final dna = UserTasteDnaModel.fromJson(json);

      expect(dna.preferredCuisines.length, 3);
      expect(dna.preferredCuisines.contains('NORTH_INDIAN'), true);
      expect(dna.dietaryPreferences.contains('HIGH_PROTEIN'), true);
      expect(dna.excludedIngredients.contains('PEANUTS'), true);
      expect(dna.budgetTier, 'MEDIUM');
      expect(dna.spicyScore, 0.85);
      expect(dna.sweetScore, 0.3);
    });

    test('should supply sensible fallbacks when fields are empty', () {
      final dna = UserTasteDnaModel.fromJson({});

      expect(dna.preferredCuisines.isEmpty, true);
      expect(dna.dietaryPreferences.isEmpty, true);
      expect(dna.excludedIngredients.isEmpty, true);
      expect(dna.budgetTier, 'MEDIUM');
      expect(dna.spicyScore, 0.7);
    });
  });
}

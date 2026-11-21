class UserTasteDnaModel {
  final List<String> preferredCuisines;
  final List<String> dietaryPreferences;
  final List<String> excludedIngredients;
  final String budgetTier;
  final double spicyScore;
  final double sweetScore;
  final double tangyScore;
  final double healthyScore;
  final double explorationScore;

  const UserTasteDnaModel({
    this.preferredCuisines = const [],
    this.dietaryPreferences = const [],
    this.excludedIngredients = const [],
    this.budgetTier = 'MEDIUM',
    this.spicyScore = 0.7,
    this.sweetScore = 0.4,
    this.tangyScore = 0.5,
    this.healthyScore = 0.6,
    this.explorationScore = 0.5,
  });

  factory UserTasteDnaModel.fromJson(Map<String, dynamic> json) {
    final profile = json['profile'] as Map<String, dynamic>? ?? json;

    final rawCuisines = profile['preferredCuisines'] as List<dynamic>? ?? [];
    final rawDietary = profile['dietaryPreferences'] as List<dynamic>? ?? [];
    final rawExcluded = profile['excludedIngredients'] as List<dynamic>? ?? [];

    return UserTasteDnaModel(
      preferredCuisines: rawCuisines.map((e) => e.toString()).toList(),
      dietaryPreferences: rawDietary.map((e) => e.toString()).toList(),
      excludedIngredients: rawExcluded.map((e) => e.toString()).toList(),
      budgetTier: profile['budgetTier']?.toString() ?? 'MEDIUM',
      spicyScore: (profile['spicyScore'] is num) ? (profile['spicyScore'] as num).toDouble() : 0.7,
      sweetScore: (profile['sweetScore'] is num) ? (profile['sweetScore'] as num).toDouble() : 0.4,
      tangyScore: (profile['tangyScore'] is num) ? (profile['tangyScore'] as num).toDouble() : 0.5,
      healthyScore: (profile['healthyScore'] is num) ? (profile['healthyScore'] as num).toDouble() : 0.6,
      explorationScore: (profile['explorationScore'] is num) ? (profile['explorationScore'] as num).toDouble() : 0.5,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'preferredCuisines': preferredCuisines,
      'dietaryPreferences': dietaryPreferences,
      'excludedIngredients': excludedIngredients,
      'budgetTier': budgetTier,
      'spicyScore': spicyScore,
      'sweetScore': sweetScore,
      'tangyScore': tangyScore,
      'healthyScore': healthyScore,
      'explorationScore': explorationScore,
    };
  }
}

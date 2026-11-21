class AppConstants {
  static const String appName = 'FoodIQ';
  static const String appTagline = 'Delicious food delivered with intelligence';

  // Storage Keys
  static const String tokenKey = 'foodiq_access_token';
  static const String refreshTokenKey = 'foodiq_refresh_token';
  static const String userKey = 'foodiq_user_data';
  static const String onboardingCompletedKey = 'foodiq_onboarding_completed';
  static const String currentRoleKey = 'foodiq_active_role';
  static const String savedAddressKey = 'foodiq_saved_address';

  // UI Dimensions & Animation Durations
  static const double cardRadius = 18.0;
  static const double buttonRadius = 14.0;
  static const double modalRadius = 24.0;
  static const Duration defaultAnimationDuration = Duration(milliseconds: 300);

  // Pagination Defaults
  static const int defaultPageSize = 20;

  // Haversine & Geolocation
  static const double defaultLatitude = 28.6139; // Delhi NCR
  static const double defaultLongitude = 77.2090;
  static const String defaultCity = 'Delhi NCR';
}

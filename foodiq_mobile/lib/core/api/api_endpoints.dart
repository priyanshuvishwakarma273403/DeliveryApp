class ApiEndpoints {
  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String sendOtp = '/auth/send-otp';
  static const String googleLogin = '/auth/google';

  // Restaurants & Menus
  static const String restaurants = '/restaurants';
  static String restaurantById(String id) => '/restaurants/$id';
  static String menuByRestaurant(String id) => '/menu/restaurant/$id';
  static const String allMenuItems = '/menu/all';

  // Cart
  static const String cart = '/cart';
  static const String cartItems = '/cart/items';
  static String cartItem(String menuItemId) => '/cart/items/$menuItemId';

  // Orders
  static const String orders = '/orders';
  static const String myOrders = '/orders/my';
  static String orderById(int id) => '/orders/$id';
  static String cancelOrder(int id) => '/orders/$id/cancel';

  // Order Brain & Twin
  static String orderTwin(int id) => '/v1/orders/$id/twin';
  static String orderHealth(int id) => '/v1/orders/$id/health';
  static String orderTimeline(int id) => '/v1/orders/$id/timeline';

  // Finance & Pricing
  static const String checkoutPrice = '/finance/checkout';
  static const String pay = '/finance/pay';
  static const String subscriptions = '/finance/subscriptions';

  // Delivery Partner
  static const String deliveryPartnerProfile = '/delivery/partner/my';
  static const String availableDeliveries = '/delivery/partner/available';
  static String acceptOrder(int orderId) => '/delivery/partner/order/$orderId/accept';
  static String pickupOrder(int orderId) => '/delivery/partner/order/$orderId/pickup';
  static String deliverOrder(int orderId) => '/delivery/partner/order/$orderId/deliver';
  static String updateRiderLocation(int orderId) => '/delivery/partner/order/$orderId/location';

  // Search & Recommendations
  static const String universalSearch = '/search/universal';
  static const String searchAutocomplete = '/search/autocomplete';
  static const String searchHistory = '/search/history';
  static const String recommendationsHome = '/v1/recommendations/home';
  static const String smartCombos = '/recommendations/combos';
  static const String userTasteProfile = '/v1/users/me/taste-dna';

  // Wallets & Notifications
  static String walletByUserId(int userId) => '/wallets/user/$userId';
  static const String notificationInbox = '/notifications/inbox';
  static const String unreadNotificationCount = '/notifications/unread-count';
  static const String supportTickets = '/support/tickets';

  // AI Food Concierge
  static const String aiChat = '/ai/chat';
  static const String aiConciergeMessage = '/v1/ai/food-concierge/message';
}

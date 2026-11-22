import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/router/router_refresh_notifier.dart';
import 'package:foodiq_mobile/features/admin/presentation/screens/admin_dashboard_shell.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/authentication/presentation/screens/forgot_password_screen.dart';
import 'package:foodiq_mobile/features/authentication/presentation/screens/login_screen.dart';
import 'package:foodiq_mobile/features/authentication/presentation/screens/otp_verification_screen.dart';
import 'package:foodiq_mobile/features/authentication/presentation/screens/register_screen.dart';
import 'package:foodiq_mobile/features/customer/presentation/screens/customer_dashboard_shell.dart';
import 'package:foodiq_mobile/features/delivery/presentation/screens/delivery_dashboard_shell.dart';
import 'package:foodiq_mobile/features/onboarding/presentation/onboarding_screen.dart';
import 'package:foodiq_mobile/features/onboarding/presentation/splash_screen.dart';
import 'package:foodiq_mobile/features/restaurant/presentation/screens/restaurant_dashboard_shell.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/screens/restaurant_detail_screen.dart';
import 'package:foodiq_mobile/features/restaurants/presentation/screens/restaurant_list_screen.dart';
import 'package:foodiq_mobile/features/role_selection/presentation/screens/role_portal_screen.dart';
import 'package:foodiq_mobile/features/search/presentation/screens/universal_search_screen.dart';
import 'package:foodiq_mobile/features/cart/presentation/screens/cart_screen.dart';
import 'package:foodiq_mobile/features/checkout/presentation/screens/checkout_screen.dart';
import 'package:foodiq_mobile/features/payments/presentation/screens/payment_selection_screen.dart';
import 'package:foodiq_mobile/features/orders/presentation/screens/order_history_screen.dart';
import 'package:foodiq_mobile/features/orders/presentation/screens/order_detail_tracking_screen.dart';
import 'package:foodiq_mobile/features/notifications/presentation/screens/notifications_inbox_screen.dart';
import 'package:foodiq_mobile/features/profile/presentation/screens/customer_profile_screen.dart';
import 'package:foodiq_mobile/features/profile/presentation/screens/taste_dna_screen.dart';
import 'package:foodiq_mobile/features/profile/presentation/screens/wallet_screen.dart';
import 'package:foodiq_mobile/features/profile/presentation/screens/support_tickets_screen.dart';
import 'package:foodiq_mobile/features/profile/presentation/screens/food_concierge_chat_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier = RouterRefreshNotifier(ref, authControllerProvider);

  return GoRouter(
    initialLocation: RoutePaths.splash,
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final isAuth = authState.isAuthenticated;
      final currentLoc = state.matchedLocation;

      final isAuthFlow = currentLoc == RoutePaths.login ||
          currentLoc == RoutePaths.register ||
          currentLoc == RoutePaths.otpVerification ||
          currentLoc == RoutePaths.forgotPassword ||
          currentLoc == RoutePaths.onboarding ||
          currentLoc == RoutePaths.splash;

      // If not logged in and trying to access private dashboard
      if (!isAuth && !isAuthFlow) {
        return RoutePaths.login;
      }

      // If logged in and at auth pages (except splash)
      if (isAuth && (currentLoc == RoutePaths.login || currentLoc == RoutePaths.register)) {
        final role = authState.user?.role ?? UserRole.customer;
        switch (role) {
          case UserRole.deliveryPartner:
            return RoutePaths.deliveryDashboard;
          case UserRole.restaurantOwner:
          case UserRole.branchManager:
          case UserRole.cashier:
          case UserRole.kitchenStaff:
            return RoutePaths.restaurantDashboard;
          case UserRole.admin:
          case UserRole.superAdmin:
          case UserRole.supportExecutive:
          case UserRole.moderator:
            return RoutePaths.adminDashboard;
          case UserRole.customer:
          default:
            return RoutePaths.customerDashboard;
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: RoutePaths.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: RoutePaths.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: RoutePaths.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RoutePaths.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: RoutePaths.otpVerification,
        builder: (context, state) {
          final data = state.extra as Map<String, dynamic>? ?? {};
          return OtpVerificationScreen(registrationData: data);
        },
      ),
      GoRoute(
        path: RoutePaths.forgotPassword,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: RoutePaths.rolePortal,
        builder: (context, state) => const RolePortalScreen(),
      ),
      GoRoute(
        path: RoutePaths.customerDashboard,
        builder: (context, state) => const CustomerDashboardShell(),
      ),
      GoRoute(
        path: RoutePaths.restaurantDashboard,
        builder: (context, state) => const RestaurantDashboardShell(),
      ),
      GoRoute(
        path: RoutePaths.deliveryDashboard,
        builder: (context, state) => const DeliveryDashboardShell(),
      ),
      GoRoute(
        path: RoutePaths.adminDashboard,
        builder: (context, state) => const AdminDashboardShell(),
      ),
      GoRoute(
        path: RoutePaths.restaurants,
        builder: (context, state) => const RestaurantListScreen(),
      ),
      GoRoute(
        path: RoutePaths.restaurantDetail,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return RestaurantDetailScreen(restaurantId: id);
        },
      ),
      GoRoute(
        path: RoutePaths.search,
        builder: (context, state) => const UniversalSearchScreen(),
      ),
      GoRoute(
        path: RoutePaths.cart,
        builder: (context, state) => const CartScreen(),
      ),
      GoRoute(
        path: RoutePaths.checkout,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          final instructions = extra['instructions'] as String?;
          return CheckoutScreen(initialInstructions: instructions);
        },
      ),
      GoRoute(
        path: RoutePaths.paymentSelection,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return PaymentSelectionScreen(
            restaurantId: extra['restaurantId']?.toString() ?? '',
            restaurantName: extra['restaurantName']?.toString() ?? 'Restaurant',
            deliveryAddress: extra['deliveryAddress']?.toString() ?? '',
            instructions: extra['instructions']?.toString(),
            amount: (extra['amount'] is num) ? (extra['amount'] as num).toDouble() : 0.0,
            walletDeduction: (extra['walletDeduction'] is num)
                ? (extra['walletDeduction'] as num).toDouble()
                : 0.0,
            useCoins: extra['useCoins'] == true,
            tipAmount: (extra['tipAmount'] is num) ? (extra['tipAmount'] as num).toDouble() : 0.0,
          );
        },
      ),
      GoRoute(
        path: RoutePaths.orders,
        builder: (context, state) => const OrderHistoryScreen(),
      ),
      GoRoute(
        path: RoutePaths.orderDetail,
        builder: (context, state) {
          final idStr = state.pathParameters['id'] ?? '0';
          final orderId = int.tryParse(idStr) ?? 0;
          return OrderDetailTrackingScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: RoutePaths.notifications,
        builder: (context, state) => const NotificationsInboxScreen(),
      ),
      GoRoute(
        path: RoutePaths.profile,
        builder: (context, state) => const CustomerProfileScreen(),
      ),
      GoRoute(
        path: '/taste-dna',
        builder: (context, state) => const TasteDnaScreen(),
      ),
      GoRoute(
        path: '/wallet',
        builder: (context, state) => const WalletScreen(),
      ),
      GoRoute(
        path: '/support-tickets',
        builder: (context, state) => const SupportTicketsScreen(),
      ),
      GoRoute(
        path: '/food-concierge',
        builder: (context, state) => const FoodConciergeChatScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );
});

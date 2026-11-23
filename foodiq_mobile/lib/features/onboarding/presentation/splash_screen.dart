import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/config/app_constants.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/storage/local_storage_service.dart';
import 'package:foodiq_mobile/core/widgets/foodiq_logo.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_state.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOutBack,
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.65, curve: Curves.easeIn),
      ),
    );

    _animationController.forward();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _initializeApp();
      }
    });
  }

  Future<void> _initializeApp() async {
    // Session restoration
    await ref.read(authControllerProvider.notifier).restoreSession();

    if (!mounted) return;

    // Minimum splash duration for smooth branding perception
    await Future.delayed(const Duration(milliseconds: 2000));

    if (!mounted) return;

    final authState = ref.read(authControllerProvider);
    final localStorage = ref.read(localStorageProvider);
    final onboardingCompleted =
        localStorage.getBool(AppConstants.onboardingCompletedKey) ?? false;

    if (authState.isAuthenticated) {
      _navigateForRole(authState.user!.role);
    } else if (!onboardingCompleted) {
      context.go(RoutePaths.onboarding);
    } else {
      context.go(RoutePaths.login);
    }
  }

  void _navigateForRole(UserRole role) {
    switch (role) {
      case UserRole.deliveryPartner:
        context.go(RoutePaths.deliveryDashboard);
        break;
      case UserRole.restaurantOwner:
      case UserRole.branchManager:
      case UserRole.cashier:
      case UserRole.kitchenStaff:
        context.go(RoutePaths.restaurantDashboard);
        break;
      case UserRole.admin:
      case UserRole.superAdmin:
      case UserRole.supportExecutive:
      case UserRole.moderator:
        context.go(RoutePaths.adminDashboard);
        break;
      case UserRole.customer:
      default:
        context.go(RoutePaths.customerDashboard);
        break;
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const FoodIQLogo(size: 46, showTagline: true),
                const SizedBox(height: 48),
                const SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    strokeWidth: 3.0,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Starting engine...',
                  style: AppTypography.bodySmall(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

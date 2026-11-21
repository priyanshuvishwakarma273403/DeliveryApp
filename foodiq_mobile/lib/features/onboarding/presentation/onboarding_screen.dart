import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/config/app_constants.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/storage/local_storage_service.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  final List<OnboardingSlide> _slides = const [
    OnboardingSlide(
      title: 'Hyper-Fast Delivery',
      subtitle: 'Fresh culinary masterpieces delivered in 30 minutes straight from top kitchens.',
      icon: Icons.electric_bolt_rounded,
      color: AppColors.primary,
    ),
    OnboardingSlide(
      title: 'AI Taste DNA',
      subtitle: 'Food tailored to your mood, weather, spice profile, and unique culinary preferences.',
      icon: Icons.auto_awesome_rounded,
      color: AppColors.secondary,
    ),
    OnboardingSlide(
      title: 'Live GPS Order Tracking',
      subtitle: 'Watch your rider progress from kitchen pickup to doorstep arrival in real time.',
      icon: Icons.navigation_rounded,
      color: AppColors.success,
    ),
  ];

  void _finishOnboarding() async {
    final localStorage = ref.read(localStorageProvider);
    await localStorage.setBool(AppConstants.onboardingCompletedKey, true);
    if (mounted) {
      context.go(RoutePaths.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        actions: [
          TextButton(
            onPressed: _finishOnboarding,
            child: const Text(
              'Skip',
              style: TextStyle(
                color: AppColors.textSecondaryLight,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (index) {
                  setState(() => _currentIndex = index);
                },
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 130,
                          height: 130,
                          decoration: BoxDecoration(
                            color: slide.color.withOpacity(0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            slide.icon,
                            size: 64,
                            color: slide.color,
                          ),
                        ),
                        const SizedBox(height: 40),
                        Text(
                          slide.title,
                          textAlign: TextAlign.center,
                          style: AppTypography.headlineMedium(),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          slide.subtitle,
                          textAlign: TextAlign.center,
                          style: AppTypography.bodyLarge(),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(28.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _slides.length,
                      (index) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _currentIndex == index ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentIndex == index
                              ? AppColors.primary
                              : AppColors.borderLight,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  AppButton(
                    text: _currentIndex == _slides.length - 1
                        ? 'Get Started'
                        : 'Continue',
                    width: double.infinity,
                    onPressed: () {
                      if (_currentIndex < _slides.length - 1) {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      } else {
                        _finishOnboarding();
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OnboardingSlide {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;

  const OnboardingSlide({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });
}

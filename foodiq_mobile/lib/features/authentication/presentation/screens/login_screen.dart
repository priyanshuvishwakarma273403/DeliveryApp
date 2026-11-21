import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/core/widgets/app_text_field.dart';
import 'package:foodiq_mobile/core/widgets/foodiq_logo.dart';
import 'package:foodiq_mobile/features/authentication/domain/models/user_model.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_state.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authControllerProvider.notifier).login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

    if (success && mounted) {
      final role = ref.read(authControllerProvider).user?.role ?? UserRole.customer;
      _navigateForRole(role);
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
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                const Center(child: FoodIQLogo(size: 38)),
                const SizedBox(height: 36),
                Text(
                  'Welcome Back!',
                  style: AppTypography.headlineMedium(),
                ),
                const SizedBox(height: 6),
                Text(
                  'Sign in to order your favorite dishes & track live runs.',
                  style: AppTypography.bodyMedium(),
                ),
                const SizedBox(height: 32),
                if (authState.errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.error.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            authState.errorMessage!,
                            style: const TextStyle(
                              color: AppColors.error,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
                AppTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hintText: 'e.g. rahul@example.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) return 'Email is required';
                    if (!val.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 18),
                AppTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hintText: 'Enter your password',
                  prefixIcon: Icons.lock_outline_rounded,
                  obscureText: _obscurePassword,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      color: AppColors.textMutedLight,
                    ),
                    onPressed: () {
                      setState(() => _obscurePassword = !_obscurePassword);
                    },
                  ),
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'Password is required';
                    if (val.length < 6) return 'Password must be at least 6 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push(RoutePaths.forgotPassword),
                    child: const Text(
                      'Forgot Password?',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                AppButton(
                  text: 'Sign In',
                  width: double.infinity,
                  isLoading: authState.isLoading,
                  onPressed: _handleLogin,
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account? ", style: AppTypography.bodyMedium()),
                    GestureDetector(
                      onTap: () => context.push(RoutePaths.register),
                      child: const Text(
                        'Register',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                const Divider(),
                const SizedBox(height: 16),
                Center(
                  child: Text(
                    'Quick Role Demo Switcher',
                    style: AppTypography.labelSmall(),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.center,
                  children: [
                    _roleChip('Customer', 'customer@foodiq.com'),
                    _roleChip('Rider', 'rider@foodiq.com'),
                    _roleChip('Owner', 'owner@foodiq.com'),
                    _roleChip('Admin', 'admin@foodiq.com'),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _roleChip(String title, String email) {
    return ActionChip(
      label: Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
      backgroundColor: AppColors.backgroundLight,
      onPressed: () {
        _emailController.text = email;
        _passwordController.text = 'secret123';
      },
    );
  }
}

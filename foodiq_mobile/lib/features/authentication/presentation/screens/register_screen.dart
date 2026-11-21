import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:foodiq_mobile/app/router/route_paths.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/core/widgets/app_text_field.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_state.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSendingOtp = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _proceedToOtp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSendingOtp = true);
    final email = _emailController.text.trim();

    final sent = await ref.read(authControllerProvider.notifier).sendOtp(email: email);
    setState(() => _isSendingOtp = false);

    if (sent && mounted) {
      context.push(
        RoutePaths.otpVerification,
        extra: {
          'name': _nameController.text.trim(),
          'email': email,
          'phone': _phoneController.text.trim(),
          'address': _addressController.text.trim(),
          'password': _passwordController.text,
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Join FoodIQ',
                  style: AppTypography.headlineMedium(),
                ),
                const SizedBox(height: 6),
                Text(
                  'Enter your details to receive an email verification OTP.',
                  style: AppTypography.bodyMedium(),
                ),
                const SizedBox(height: 28),
                if (authState.errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      authState.errorMessage!,
                      style: const TextStyle(color: AppColors.error, fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                AppTextField(
                  controller: _nameController,
                  label: 'Full Name',
                  hintText: 'e.g. Rahul Sharma',
                  prefixIcon: Icons.person_outline_rounded,
                  validator: (val) => val == null || val.trim().isEmpty ? 'Name is required' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hintText: 'e.g. rahul@example.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (val) => val == null || !val.contains('@') ? 'Valid email required' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _phoneController,
                  label: 'Phone Number',
                  hintText: 'e.g. 9876543210',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (val) => val == null || val.trim().length < 10 ? 'Enter 10-digit mobile number' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _addressController,
                  label: 'Delivery Address',
                  hintText: 'e.g. Sector 62, Noida, UP',
                  prefixIcon: Icons.location_on_outlined,
                  validator: (val) => val == null || val.trim().isEmpty ? 'Address is required' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hintText: 'Minimum 6 characters',
                  prefixIcon: Icons.lock_outline_rounded,
                  obscureText: true,
                  validator: (val) => val == null || val.length < 6 ? 'Password must be >= 6 chars' : null,
                ),
                const SizedBox(height: 28),
                AppButton(
                  text: 'Send Verification OTP',
                  width: double.infinity,
                  isLoading: _isSendingOtp,
                  onPressed: _proceedToOtp,
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Already registered? ', style: AppTypography.bodyMedium()),
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: const Text(
                        'Sign In',
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

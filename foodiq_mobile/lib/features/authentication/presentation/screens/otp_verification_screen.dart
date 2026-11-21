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

class OtpVerificationScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> registrationData;

  const OtpVerificationScreen({super.key, required this.registrationData});

  @override
  ConsumerState<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends ConsumerState<OtpVerificationScreen> {
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  void _verifyAndRegister() async {
    final otp = _otpController.text.trim();
    if (otp.length < 6) return;

    final success = await ref.read(authControllerProvider.notifier).register(
          name: widget.registrationData['name'] ?? '',
          email: widget.registrationData['email'] ?? '',
          password: widget.registrationData['password'] ?? '',
          phone: widget.registrationData['phone'] ?? '',
          address: widget.registrationData['address'] ?? '',
          otp: otp,
        );

    if (success && mounted) {
      context.go(RoutePaths.customerDashboard);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final email = widget.registrationData['email'] ?? '';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('Verify Email')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Enter OTP Code',
                style: AppTypography.headlineMedium(),
              ),
              const SizedBox(height: 6),
              Text(
                'We have dispatched a 6-digit verification code to $email',
                style: AppTypography.bodyMedium(),
              ),
              const SizedBox(height: 32),
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
                controller: _otpController,
                label: '6-Digit Verification Code',
                hintText: 'e.g. 123456',
                prefixIcon: Icons.security_rounded,
                keyboardType: TextInputType.number,
                validator: (val) => val == null || val.length != 6 ? 'Enter 6 digits' : null,
              ),
              const SizedBox(height: 28),
              AppButton(
                text: 'Verify & Create Account',
                width: double.infinity,
                isLoading: authState.isLoading,
                onPressed: _verifyAndRegister,
              ),
              const SizedBox(height: 20),
              Center(
                child: TextButton(
                  onPressed: () {
                    ref.read(authControllerProvider.notifier).sendOtp(email: email);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Verification code resent!')),
                    );
                  },
                  child: const Text('Resend Code', style: TextStyle(color: AppColors.primary)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

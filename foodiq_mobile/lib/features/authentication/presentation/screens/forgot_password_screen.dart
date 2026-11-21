import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/core/widgets/app_text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('Reset Password')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: _submitted
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.mark_email_read_rounded, size: 64, color: Colors.green),
                      const SizedBox(height: 20),
                      Text('Check Your Inbox', style: AppTypography.headlineSmall()),
                      const SizedBox(height: 10),
                      Text(
                        'Password reset instructions have been sent to ${_emailController.text}',
                        textAlign: TextAlign.center,
                        style: AppTypography.bodyMedium(),
                      ),
                      const SizedBox(height: 24),
                      AppButton(
                        text: 'Back to Login',
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Forgot Password?', style: AppTypography.headlineMedium()),
                    const SizedBox(height: 8),
                    Text(
                      'Enter your registered email address to receive password recovery instructions.',
                      style: AppTypography.bodyMedium(),
                    ),
                    const SizedBox(height: 32),
                    AppTextField(
                      controller: _emailController,
                      label: 'Email Address',
                      hintText: 'e.g. rahul@example.com',
                      prefixIcon: Icons.email_outlined,
                    ),
                    const SizedBox(height: 28),
                    AppButton(
                      text: 'Send Reset Link',
                      width: double.infinity,
                      onPressed: () {
                        if (_emailController.text.contains('@')) {
                          setState(() => _submitted = true);
                        }
                      },
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';

void main() {
  group('AppButton Widget Tests', () {
    testWidgets('should render text and trigger callback on tap', (tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppButton(
              text: 'Order Now',
              onPressed: () {
                tapped = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('Order Now'), findsOneWidget);
      await tester.tap(find.text('Order Now'));
      expect(tapped, isTrue);
    });

    testWidgets('should display loading spinner when isLoading is true', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppButton(
              text: 'Submit',
              isLoading: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Submit'), findsNothing);
    });
  });
}

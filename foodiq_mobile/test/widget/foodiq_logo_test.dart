import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/core/widgets/foodiq_logo.dart';

void main() {
  group('FoodIQLogo Widget Tests', () {
    testWidgets('should render logo with Food and IQ text spans', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: FoodIQLogo(showTagline: true),
          ),
        ),
      );

      expect(find.byIcon(Icons.restaurant_rounded), findsOneWidget);
      expect(find.text('INTELLIGENT FOOD DELIVERY'), findsOneWidget);
    });
  });
}

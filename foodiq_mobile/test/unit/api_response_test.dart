import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/core/api/api_response.dart';

void main() {
  group('ApiResponse Deserialization Tests', () {
    test('should parse successful ApiResponse with data', () {
      final json = {
        'success': true,
        'message': 'Data retrieved',
        'data': {'id': 1, 'name': 'Pizza Margherita'},
        'timestamp': '2026-11-21T10:00:00',
      };

      final response = ApiResponse.fromJson(
        json,
        (data) => (data as Map<String, dynamic>)['name'] as String,
      );

      expect(response.success, isTrue);
      expect(response.message, 'Data retrieved');
      expect(response.data, 'Pizza Margherita');
    });

    test('should parse error ApiResponse with null data', () {
      final json = {
        'success': false,
        'message': 'User not found',
        'data': null,
      };

      final response = ApiResponse<String>.fromJson(json, null);

      expect(response.success, isFalse);
      expect(response.message, 'User not found');
      expect(response.data, isNull);
    });
  });
}

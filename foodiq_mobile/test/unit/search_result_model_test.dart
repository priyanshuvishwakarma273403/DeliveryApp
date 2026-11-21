import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/search/domain/models/search_result_model.dart';

void main() {
  group('SearchResultItemModel Tests', () {
    test('should parse RESTAURANT search item correctly', () {
      final json = {
        'id': 'r_10',
        'name': 'Biryani Blues',
        'description': 'Hyderabadi Dum Biryani Specialist',
        'imageUrl': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8',
        'type': 'RESTAURANT',
        'rating': 4.4,
      };

      final item = SearchResultItemModel.fromJson(json);

      expect(item.id, 'r_10');
      expect(item.title, 'Biryani Blues');
      expect(item.subtitle, 'Hyderabadi Dum Biryani Specialist');
      expect(item.type, SearchItemType.restaurant);
      expect(item.rating, 4.4);
      expect(item.price, null);
    });

    test('should parse MENU_ITEM search item correctly', () {
      final json = {
        'id': 'm_55',
        'title': 'Veg Hakka Noodles',
        'subtitle': 'Stir-fried noodles with crisp veggies',
        'type': 'MENU_ITEM',
        'price': 180.0,
        'restaurantId': 'r_10',
      };

      final item = SearchResultItemModel.fromJson(json);

      expect(item.id, 'm_55');
      expect(item.title, 'Veg Hakka Noodles');
      expect(item.type, SearchItemType.menuItem);
      expect(item.price, 180.0);
      expect(item.restaurantId, 'r_10');
    });

    test('should parse SearchSuggestionModel from plain string or map', () {
      final suggestion1 = SearchSuggestionModel.fromJson('Momos');
      expect(suggestion1.query, 'Momos');
      expect(suggestion1.category, null);

      final suggestion2 = SearchSuggestionModel.fromJson({
        'query': 'Pizza',
        'category': 'Italian',
      });
      expect(suggestion2.query, 'Pizza');
      expect(suggestion2.category, 'Italian');
    });
  });
}

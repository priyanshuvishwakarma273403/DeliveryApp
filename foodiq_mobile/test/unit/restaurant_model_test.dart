import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/shared/models/restaurant_model.dart';
import 'package:foodiq_mobile/shared/models/menu_item_model.dart';

void main() {
  group('RestaurantModel Serialization Tests', () {
    test('should parse valid Spring Boot restaurant json correctly', () {
      final json = {
        'id': 'rest_101',
        'name': 'Punjabi Angithi',
        'address': 'Connaught Place, Central Delhi',
        'city': 'New Delhi',
        'cuisineType': 'North Indian',
        'phone': '+919876543210',
        'imageUrl': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        'rating': 4.6,
        'avgDeliveryTime': 25,
        'minOrderAmount': 200.0,
        'open': true,
      };

      final restaurant = RestaurantModel.fromJson(json);

      expect(restaurant.id, 'rest_101');
      expect(restaurant.name, 'Punjabi Angithi');
      expect(restaurant.city, 'New Delhi');
      expect(restaurant.cuisineType, 'North Indian');
      expect(restaurant.rating, 4.6);
      expect(restaurant.avgDeliveryTime, 25);
      expect(restaurant.minOrderAmount, 200.0);
      expect(restaurant.open, true);
    });

    test('should provide sensible fallback defaults when fields are missing', () {
      final json = {
        'id': 55,
        'name': 'Burger King',
        'address': 'Cyber Hub',
        'city': 'Gurugram',
      };

      final restaurant = RestaurantModel.fromJson(json);

      expect(restaurant.id, '55');
      expect(restaurant.cuisineType, 'Multi-Cuisine');
      expect(restaurant.rating, 4.2);
      expect(restaurant.avgDeliveryTime, 30);
      expect(restaurant.minOrderAmount, 150.0);
      expect(restaurant.open, true);
    });

    test('should round-trip toJson properly', () {
      const restaurant = RestaurantModel(
        id: 'r1',
        name: 'Haldiram',
        address: 'Sector 18',
        city: 'Noida',
        cuisineType: 'Sweets & Snacks',
        rating: 4.5,
        avgDeliveryTime: 20,
        minOrderAmount: 100.0,
        open: true,
      );

      final json = restaurant.toJson();
      expect(json['id'], 'r1');
      expect(json['name'], 'Haldiram');
      expect(json['cuisineType'], 'Sweets & Snacks');
      expect(json['rating'], 4.5);
    });
  });

  group('MenuItemModel Tests', () {
    test('should infer non-veg if chicken is in the item name', () {
      final json = {
        'id': 'm1',
        'name': 'Butter Chicken Masala',
        'description': 'Tender chicken pieces in rich tomato cream gravy',
        'price': 349.0,
        'category': 'Main Course',
        'restaurantId': 'rest_101',
      };

      final item = MenuItemModel.fromJson(json);

      expect(item.id, 'm1');
      expect(item.name, 'Butter Chicken Masala');
      expect(item.isVeg, false);
      expect(item.price, 349.0);
    });

    test('should infer veg when no meat keywords are present and isVeg is not specified', () {
      final json = {
        'id': 'm2',
        'name': 'Paneer Butter Masala',
        'description': 'Cottage cheese cubes in butter tomato gravy',
        'price': 279.0,
        'category': 'Main Course',
        'restaurantId': 'rest_101',
      };

      final item = MenuItemModel.fromJson(json);

      expect(item.name, 'Paneer Butter Masala');
      expect(item.isVeg, true);
    });

    test('should respect explicit isVeg flag from backend if present', () {
      final json = {
        'id': 'm3',
        'name': 'Special Platter',
        'description': 'Mixed gourmet appetizers',
        'price': 499.0,
        'category': 'Starters',
        'restaurantId': 'rest_101',
        'isVeg': false,
      };

      final item = MenuItemModel.fromJson(json);
      expect(item.isVeg, false);
    });
  });
}

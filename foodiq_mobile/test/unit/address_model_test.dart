import 'package:flutter_test/flutter_test.dart';
import 'package:foodiq_mobile/features/location/domain/models/address_model.dart';

void main() {
  group('AddressModel Tests', () {
    test('should parse address JSON accurately', () {
      final json = {
        'id': 'addr_1',
        'label': 'Home',
        'addressLine': 'Flat 402, Sunshine Apartments, DLF Phase 5',
        'city': 'Gurugram',
        'latitude': 28.4595,
        'longitude': 77.0266,
        'isDefault': true,
      };

      final address = AddressModel.fromJson(json);

      expect(address.id, 'addr_1');
      expect(address.label, 'Home');
      expect(address.addressLine, 'Flat 402, Sunshine Apartments, DLF Phase 5');
      expect(address.city, 'Gurugram');
      expect(address.latitude, 28.4595);
      expect(address.longitude, 77.0266);
      expect(address.isDefault, true);
    });

    test('should fallback to default coordinates if coordinates are missing', () {
      final json = {
        'id': 'addr_2',
        'address': 'Connaught Place',
      };

      final address = AddressModel.fromJson(json);

      expect(address.id, 'addr_2');
      expect(address.label, 'Home');
      expect(address.addressLine, 'Connaught Place');
      expect(address.city, 'Delhi NCR');
      expect(address.latitude, 28.6139);
      expect(address.longitude, 77.2090);
      expect(address.isDefault, false);
    });

    test('should copyWith properly modify properties', () {
      const address = AddressModel(
        id: 'addr_10',
        label: 'Work',
        addressLine: 'Cyber Park',
        city: 'Gurugram',
        latitude: 28.45,
        longitude: 77.02,
      );

      final updated = address.copyWith(isDefault: true, label: 'Office');

      expect(updated.id, 'addr_10');
      expect(updated.label, 'Office');
      expect(updated.isDefault, true);
      expect(updated.addressLine, 'Cyber Park');
    });
  });
}

import 'package:foodiq_mobile/features/location/domain/models/address_model.dart';

abstract class LocationRepository {
  Future<AddressModel> getCurrentLocation();
  Future<List<AddressModel>> getSavedAddresses();
  Future<void> saveAddress(AddressModel address);
  Future<void> deleteAddress(String id);
  Future<bool> checkServiceability(String city);
}

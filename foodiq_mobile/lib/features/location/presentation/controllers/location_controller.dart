import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/location/data/repositories/location_repository_impl.dart';
import 'package:foodiq_mobile/features/location/domain/models/address_model.dart';
import 'package:foodiq_mobile/features/location/domain/repositories/location_repository.dart';

final activeAddressProvider = StateNotifierProvider<LocationController, AddressModel?>((ref) {
  final repository = ref.watch(locationRepositoryProvider);
  return LocationController(repository);
});

final locationControllerProvider = activeAddressProvider;

final savedAddressesProvider = FutureProvider<List<AddressModel>>((ref) async {
  final repository = ref.watch(locationRepositoryProvider);
  return await repository.getSavedAddresses();
});

class LocationController extends StateNotifier<AddressModel?> {
  final LocationRepository _repository;

  LocationController(this._repository) : super(null) {
    loadCurrentLocation();
  }

  Future<void> loadCurrentLocation() async {
    try {
      final address = await _repository.getCurrentLocation();
      state = address;
    } catch (_) {
      state = const AddressModel(
        id: 'fallback',
        label: 'Home',
        addressLine: 'Connaught Place, New Delhi',
        city: 'Delhi NCR',
        latitude: 28.6139,
        longitude: 77.2090,
      );
    }
  }

  Future<void> selectAddress(AddressModel address) async {
    state = address;
    await _repository.saveAddress(address);
  }
}

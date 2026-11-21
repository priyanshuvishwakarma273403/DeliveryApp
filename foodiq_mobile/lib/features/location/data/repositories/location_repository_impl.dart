import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/config/app_constants.dart';
import 'package:foodiq_mobile/core/api/api_client.dart';
import 'package:foodiq_mobile/core/api/api_response.dart';
import 'package:foodiq_mobile/core/storage/local_storage_service.dart';
import 'package:foodiq_mobile/features/location/domain/models/address_model.dart';
import 'package:foodiq_mobile/features/location/domain/repositories/location_repository.dart';

final locationRepositoryProvider = Provider<LocationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final localStorage = ref.watch(localStorageProvider);
  return LocationRepositoryImpl(apiClient, localStorage);
});

class LocationRepositoryImpl implements LocationRepository {
  final ApiClient _apiClient;
  final LocalStorageService _localStorage;

  LocationRepositoryImpl(this._apiClient, this._localStorage);

  @override
  Future<AddressModel> getCurrentLocation() async {
    // Check if an address was previously chosen
    final savedJson = _localStorage.getString(AppConstants.savedAddressKey);
    if (savedJson != null) {
      try {
        final map = jsonDecode(savedJson) as Map<String, dynamic>;
        return AddressModel.fromJson(map);
      } catch (_) {}
    }

    // Default to prime coverage location (Connaught Place, New Delhi)
    const defaultAddress = AddressModel(
      id: 'default-1',
      label: 'Home',
      addressLine: 'Connaught Place, Central Delhi',
      city: 'Delhi NCR',
      latitude: AppConstants.defaultLatitude,
      longitude: AppConstants.defaultLongitude,
      isDefault: true,
    );

    await saveAddress(defaultAddress);
    return defaultAddress;
  }

  @override
  Future<List<AddressModel>> getSavedAddresses() async {
    final list = [
      const AddressModel(
        id: 'addr-1',
        label: 'Home',
        addressLine: 'Block B, Sector 62, Noida, Uttar Pradesh',
        city: 'Noida',
        latitude: 28.6280,
        longitude: 77.3649,
        isDefault: true,
      ),
      const AddressModel(
        id: 'addr-2',
        label: 'Office',
        addressLine: 'Cyber City, Phase 2, Gurugram, Haryana',
        city: 'Gurugram',
        latitude: 28.4900,
        longitude: 77.0800,
        isDefault: false,
      ),
      const AddressModel(
        id: 'addr-3',
        label: 'Other',
        addressLine: 'Connaught Place, Central Delhi, New Delhi',
        city: 'Delhi NCR',
        latitude: AppConstants.defaultLatitude,
        longitude: AppConstants.defaultLongitude,
        isDefault: false,
      ),
    ];
    return list;
  }

  @override
  Future<void> saveAddress(AddressModel address) async {
    await _localStorage.setString(
      AppConstants.savedAddressKey,
      jsonEncode(address.toJson()),
    );
  }

  @override
  Future<void> deleteAddress(String id) async {
    // In-memory / local storage removal
  }

  @override
  Future<bool> checkServiceability(String city) async {
    try {
      final response = await _apiClient.get(
        '/restaurants/city/$city',
      );
      final apiResponse = ApiResponse.fromJson(
        response.data as Map<String, dynamic>,
        (json) => json as List<dynamic>,
      );
      return apiResponse.success && (apiResponse.data?.isNotEmpty ?? false);
    } catch (_) {
      return true; // Fallback to available
    }
  }
}

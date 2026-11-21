import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';
import 'package:foodiq_mobile/core/widgets/app_button.dart';
import 'package:foodiq_mobile/core/widgets/app_card.dart';
import 'package:foodiq_mobile/features/location/domain/models/address_model.dart';
import 'package:foodiq_mobile/features/location/presentation/controllers/location_controller.dart';

class LocationPickerSheet extends ConsumerWidget {
  const LocationPickerSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const LocationPickerSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeAddress = ref.watch(activeAddressProvider);
    final savedAddressesAsync = ref.watch(savedAddressesProvider);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Select Delivery Location', style: AppTypography.titleLarge()),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // GPS Current Location Detection
          AppButton(
            text: 'Use Current Location (GPS)',
            icon: Icons.my_location_rounded,
            type: AppButtonType.outline,
            width: double.infinity,
            onPressed: () {
              ref.read(activeAddressProvider.notifier).selectAddress(
                    const AddressModel(
                      id: 'gps-current',
                      label: 'Current Location',
                      addressLine: 'Near Connaught Place, New Delhi',
                      city: 'Delhi NCR',
                      latitude: 28.6139,
                      longitude: 77.2090,
                    ),
                  );
              Navigator.pop(context);
            },
          ),
          const SizedBox(height: 24),
          Text('SAVED ADDRESSES', style: AppTypography.labelSmall()),
          const SizedBox(height: 12),
          savedAddressesAsync.when(
            data: (addresses) => Column(
              children: addresses.map((addr) {
                final isSelected = activeAddress?.id == addr.id;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    backgroundColor: isSelected
                        ? AppColors.primary.withOpacity(0.06)
                        : Colors.white,
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.borderLight,
                      width: isSelected ? 1.5 : 1,
                    ),
                    onTap: () {
                      ref.read(activeAddressProvider.notifier).selectAddress(addr);
                      Navigator.pop(context);
                    },
                    child: Row(
                      children: [
                        Icon(
                          addr.label == 'Home'
                              ? Icons.home_rounded
                              : addr.label == 'Office'
                                  ? Icons.work_rounded
                                  : Icons.location_on_rounded,
                          color: isSelected ? AppColors.primary : AppColors.textSecondaryLight,
                          size: 24,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(addr.label, style: AppTypography.titleMedium()),
                              const SizedBox(height: 2),
                              Text(
                                addr.addressLine,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.bodySmall(),
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          const Icon(Icons.check_circle_rounded, color: AppColors.primary),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => Text('Failed to load saved addresses: $err'),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

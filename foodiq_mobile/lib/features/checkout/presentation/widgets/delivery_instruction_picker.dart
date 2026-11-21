import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';

class DeliveryInstructionPicker extends StatefulWidget {
  final ValueChanged<String> onInstructionsChanged;

  const DeliveryInstructionPicker({
    super.key,
    required this.onInstructionsChanged,
  });

  @override
  State<DeliveryInstructionPicker> createState() => _DeliveryInstructionPickerState();
}

class _DeliveryInstructionPickerState extends State<DeliveryInstructionPicker> {
  final Set<String> _selectedOptions = {};

  final List<Map<String, dynamic>> _options = [
    {'label': 'Leave at door', 'icon': Icons.door_front_door_outlined},
    {'label': 'Avoid calling', 'icon': Icons.phone_disabled_outlined},
    {'label': 'Do not ring bell', 'icon': Icons.notifications_off_outlined},
    {'label': 'Pet at home', 'icon': Icons.pets_outlined},
  ];

  void _toggleOption(String label) {
    setState(() {
      if (_selectedOptions.contains(label)) {
        _selectedOptions.remove(label);
      } else {
        _selectedOptions.add(label);
      }
    });
    widget.onInstructionsChanged(_selectedOptions.join(', '));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBackground(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Delivery Instructions',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _options.map((opt) {
              final label = opt['label'] as String;
              final icon = opt['icon'] as IconData;
              final isSelected = _selectedOptions.contains(label);

              return ChoiceChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      icon,
                      size: 14,
                      color: isSelected ? Colors.white : AppColors.neutralGray,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 11,
                        color: isSelected ? Colors.white : null,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
                selected: isSelected,
                selectedColor: AppColors.primaryRed,
                backgroundColor: AppColors.cardBackground(Theme.of(context).brightness),
                onSelected: (_) => _toggleOption(label),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(
                    color: isSelected ? AppColors.primaryRed : Colors.grey.withOpacity(0.3),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

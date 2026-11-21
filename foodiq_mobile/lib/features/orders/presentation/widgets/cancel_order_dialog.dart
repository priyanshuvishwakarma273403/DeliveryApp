import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';

class CancelOrderDialog extends StatefulWidget {
  final int orderId;
  final ValueChanged<String> onConfirmCancel;

  const CancelOrderDialog({
    super.key,
    required this.orderId,
    required this.onConfirmCancel,
  });

  @override
  State<CancelOrderDialog> createState() => _CancelOrderDialogState();
}

class _CancelOrderDialogState extends State<CancelOrderDialog> {
  String _selectedReason = 'Changed my mind';

  final List<String> _reasons = [
    'Changed my mind',
    'Ordered by mistake',
    'Selected wrong delivery address',
    'Too long estimated delivery time',
    'Want to add/remove dishes',
  ];

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Cancel Order?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Please let us know why you are cancelling this order:',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
          const SizedBox(height: 10),
          ..._reasons.map((reason) {
            return RadioListTile<String>(
              dense: true,
              contentPadding: EdgeInsets.zero,
              value: reason,
              groupValue: _selectedReason,
              activeColor: AppColors.primaryRed,
              title: Text(reason, style: const TextStyle(fontSize: 13)),
              onChanged: (val) {
                if (val != null) setState(() => _selectedReason = val);
              },
            );
          }),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Keep Order'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryRed),
          onPressed: () {
            Navigator.pop(context);
            widget.onConfirmCancel(_selectedReason);
          },
          child: const Text('Cancel Order', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/features/orders/domain/models/order_digital_twin_model.dart';

class OrderTwinCard extends StatelessWidget {
  final OrderDigitalTwinModel twin;

  const OrderTwinCard({
    super.key,
    required this.twin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBackground(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.purple.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology_outlined, color: Colors.purple, size: 20),
              const SizedBox(width: 8),
              const Text(
                'FoodIQ Order Brain (Digital Twin)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.purple),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: twin.isHealthy ? AppColors.vegGreen.withOpacity(0.12) : Colors.orange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  twin.overallHealth,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: twin.isHealthy ? AppColors.vegGreen : Colors.orange,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Kitchen progress
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Kitchen Cooking Progress', style: TextStyle(fontSize: 12, color: Colors.grey)),
              Text('${(twin.kitchenProgress * 100).round()}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: twin.kitchenProgress.clamp(0.0, 1.0),
              backgroundColor: Colors.grey.withOpacity(0.15),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.purple),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 10),

          // Risk & ETA prediction tags
          Row(
            children: [
              _buildMetricChip('SLA Risk: ${twin.slaRisk}', Icons.shield_outlined),
              const SizedBox(width: 8),
              _buildMetricChip('Rider: ${twin.riderStatus}', Icons.pedal_bike_outlined),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricChip(String text, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.08),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.grey),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/utils/date_formatter.dart';
import 'package:foodiq_mobile/features/notifications/domain/models/notification_model.dart';

class NotificationTile extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback onTap;

  const NotificationTile({
    super.key,
    required this.notification,
    required this.onTap,
  });

  IconData _getIconForType(String type) {
    switch (type.toUpperCase()) {
      case 'SUCCESS':
        return Icons.check_circle_outline;
      case 'WARNING':
        return Icons.warning_amber_rounded;
      case 'ERROR':
        return Icons.error_outline;
      case 'MARKETING':
        return Icons.local_offer_outlined;
      default:
        return Icons.notifications_none_rounded;
    }
  }

  Color _getColorForType(String type) {
    switch (type.toUpperCase()) {
      case 'SUCCESS':
        return AppColors.vegGreen;
      case 'WARNING':
        return AppColors.accentOrange;
      case 'ERROR':
        return AppColors.primaryRed;
      case 'MARKETING':
        return Colors.purple;
      default:
        return AppColors.primaryRed;
    }
  }

  @override
  Widget build(BuildContext context) {
    final iconColor = _getColorForType(notification.type);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: notification.isRead
            ? AppColors.cardBackground(Theme.of(context).brightness)
            : iconColor.withOpacity(0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: notification.isRead
              ? Colors.grey.withOpacity(0.12)
              : iconColor.withOpacity(0.3),
        ),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(_getIconForType(notification.type), color: iconColor, size: 20),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                notification.title,
                style: TextStyle(
                  fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
            if (!notification.isRead)
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: iconColor, shape: BoxShape.circle),
              ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 3),
            Text(
              notification.body,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: AppColors.neutralGray),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormatter.formatDate(notification.timestamp),
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}

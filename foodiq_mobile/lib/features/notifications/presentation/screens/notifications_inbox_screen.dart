import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/core/widgets/empty_state_view.dart';
import 'package:foodiq_mobile/core/widgets/error_view.dart';
import 'package:foodiq_mobile/features/notifications/presentation/controllers/notification_controller.dart';
import 'package:foodiq_mobile/features/notifications/presentation/widgets/notification_tile.dart';

class NotificationsInboxScreen extends ConsumerStatefulWidget {
  const NotificationsInboxScreen({super.key});

  @override
  ConsumerState<NotificationsInboxScreen> createState() => _NotificationsInboxScreenState();
}

class _NotificationsInboxScreenState extends ConsumerState<NotificationsInboxScreen> {
  String _selectedTab = 'ALL';

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(notificationInboxProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: notificationsAsync.when(
        data: (notifications) {
          final filtered = _selectedTab == 'ALL'
              ? notifications
              : notifications.where((n) => n.type.toUpperCase() == _selectedTab).toList();

          return Column(
            children: [
              // Filter Chips
              Container(
                height: 44,
                margin: const EdgeInsets.symmetric(vertical: 8),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _buildChip('ALL', 'All'),
                    const SizedBox(width: 8),
                    _buildChip('SUCCESS', 'Orders'),
                    const SizedBox(width: 8),
                    _buildChip('MARKETING', 'Offers'),
                    const SizedBox(width: 8),
                    _buildChip('SYSTEM', 'System'),
                  ],
                ),
              ),

              Expanded(
                child: filtered.isEmpty
                    ? EmptyStateView(
                        title: 'No notifications',
                        message: 'You are all caught up! Updates regarding your orders and offers will appear here.',
                        icon: Icons.notifications_none_rounded,
                      )
                    : RefreshIndicator(
                        color: AppColors.primaryRed,
                        onRefresh: () async {
                          await ref.read(notificationInboxProvider.notifier).refresh();
                        },
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final notification = filtered[index];
                            return NotificationTile(
                              notification: notification,
                              onTap: () {
                                if (!notification.isRead) {
                                  ref
                                      .read(notificationInboxProvider.notifier)
                                      .markAsRead(notification.id);
                                }
                              },
                            );
                          },
                        ),
                      ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(
          message: err.toString(),
          onRetry: () => ref.read(notificationInboxProvider.notifier).refresh(),
        ),
      ),
    );
  }

  Widget _buildChip(String tabKey, String label) {
    final isSelected = _selectedTab == tabKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primaryRed,
      labelStyle: TextStyle(
        fontSize: 12,
        color: isSelected ? Colors.white : null,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (_) => setState(() => _selectedTab = tabKey),
    );
  }
}

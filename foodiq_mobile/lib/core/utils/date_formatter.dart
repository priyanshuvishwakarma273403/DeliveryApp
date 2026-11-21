import 'package:intl/intl.dart';

class DateFormatter {
  static String formatDateTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    return DateFormat('dd MMM yyyy, hh:mm a').format(dateTime);
  }

  static String formatTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    return DateFormat('hh:mm a').format(dateTime);
  }

  static String formatRelative(DateTime? dateTime) {
    if (dateTime == null) return '';
    final difference = DateTime.now().difference(dateTime);

    if (difference.inSeconds < 60) return 'Just now';
    if (difference.inMinutes < 60) return '${difference.inMinutes}m ago';
    if (difference.inHours < 24) return '${difference.inHours}h ago';
    if (difference.inDays < 7) return '${difference.inDays}d ago';
    return DateFormat('dd MMM').format(dateTime);
  }
}

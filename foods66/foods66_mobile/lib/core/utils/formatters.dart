import 'package:intl/intl.dart';

/// Formatting utilities for FOODS66
class Formatters {
  Formatters._();

  /// Format price in Indian Rupees: ₹199, ₹1,299
  static String price(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }

  /// Format price with decimals: ₹199.50
  static String priceDecimal(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }

  /// Format date: "10 Sep 2026"
  static String date(DateTime dateTime) {
    return DateFormat('dd MMM yyyy').format(dateTime);
  }

  /// Format date-time: "10 Sep 2026, 9:25 AM"
  static String dateTime(DateTime dateTime) {
    return DateFormat('dd MMM yyyy, h:mm a').format(dateTime);
  }

  /// Format time: "9:25 AM"
  static String time(DateTime dateTime) {
    return DateFormat('h:mm a').format(dateTime);
  }

  /// Relative time: "2 hours ago", "just now"
  static String timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return date(dateTime);
  }

  /// Capitalize first letter
  static String capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1).toLowerCase();
  }

  /// Format order status: "OUT_FOR_DELIVERY" → "Out For Delivery"
  static String orderStatus(String status) {
    return status
        .split('_')
        .map((word) => capitalize(word))
        .join(' ');
  }
}

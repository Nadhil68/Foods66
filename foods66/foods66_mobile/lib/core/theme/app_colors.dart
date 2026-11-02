import 'package:flutter/material.dart';

/// Centralized color palette for FOODS66
class AppColors {
  AppColors._();

  // Brand Colors
  static const Color primary = Color(0xFFE94560);
  static const Color primaryDark = Color(0xFFC73550);
  static const Color primaryLight = Color(0xFFFF6B81);
  static const Color secondary = Color(0xFF16213E);
  static const Color secondaryLight = Color(0xFF1A1A2E);
  static const Color accent = Color(0xFFFF9F43);

  // Background
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Colors.white;
  static const Color surfaceVariant = Color(0xFFF0F0F5);

  // Text
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF6C757D);
  static const Color textHint = Color(0xFFADB5BD);
  static const Color textOnPrimary = Colors.white;

  // Status
  static const Color success = Color(0xFF28A745);
  static const Color warning = Color(0xFFFFC107);
  static const Color error = Color(0xFFDC3545);
  static const Color info = Color(0xFF17A2B8);

  // Order Status Colors
  static const Color statusPlaced = Color(0xFF6C757D);
  static const Color statusConfirmed = Color(0xFF17A2B8);
  static const Color statusPreparing = Color(0xFFFFC107);
  static const Color statusOnTheWay = Color(0xFFFF9F43);
  static const Color statusDelivered = Color(0xFF28A745);
  static const Color statusCancelled = Color(0xFFDC3545);

  // Misc
  static const Color divider = Color(0xFFE9ECEF);
  static const Color shimmerBase = Color(0xFFE0E0E0);
  static const Color shimmerHighlight = Color(0xFFF5F5F5);
  static const Color rating = Color(0xFFFFC107);
  static const Color shadow = Color(0x1A000000);
}

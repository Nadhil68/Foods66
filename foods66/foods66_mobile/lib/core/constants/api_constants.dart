import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class ApiConstants {
  ApiConstants._();

  // Use --dart-define=API_URL=https://api.yourdomain.com/api at build time
  static const String _envApiUrl = String.fromEnvironment('API_URL', defaultValue: '');
  static const String _envImageUrl = String.fromEnvironment('IMAGE_URL', defaultValue: '');

  /// Base URL for the backend API.
  static String get baseUrl {
    if (_envApiUrl.isNotEmpty) {
      return _envApiUrl;
    }
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  }

  /// Base URL for serving images/uploads.
  static String get imageBaseUrl {
    if (_envImageUrl.isNotEmpty) {
      return _envImageUrl;
    }
    if (kIsWeb) {
      return 'http://localhost:5000';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000';
    } else {
      return 'http://localhost:5000';
    }
  }

  // ── Auth ──
  static const String login = '/users/login';
  static const String register = '/users/register';
  static const String me = '/users/me';
  static const String profile = '/users/profile';
  static const String changePassword = '/users/change-password';

  // ── Foods ──
  static const String foods = '/foods';
  static String foodById(String id) => '/foods/$id';

  // ── Restaurants ──
  static const String restaurants = '/restaurants';
  static String restaurantById(String id) => '/restaurants/$id';

  // ── Search ──
  static const String search = '/search';

  // ── Orders ──
  static const String orders = '/orders';
  static String orderById(String id) => '/orders/$id';
  static String orderStatus(String id) => '/orders/$id/status';

  // ── Payments ──
  static const String createPaymentSession = '/payments/create-session';
  static String paymentStatus(String orderId) => '/payments/status/$orderId';
  static String verifyPayment(String orderId) => '/payments/verify/$orderId';

  // ── Favorites ──
  static const String favorites = '/favorites';
  static String removeFavorite(String foodId) => '/favorites/$foodId';
  static String checkFavorite(String foodId) => '/favorites/check/$foodId';

  // ── Coupons ──
  static const String coupons = '/coupons';

  // ── Feedback ──
  static const String feedback = '/feedback';

  // ── Health ──
  static const String reverseGeocode = '/users/reverse-geocode';
}

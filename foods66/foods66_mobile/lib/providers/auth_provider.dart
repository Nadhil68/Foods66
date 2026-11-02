import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  bool _isAuthenticated = false;
  bool _isLoading = false;
  UserModel? _user;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  UserModel? get user => _user;
  String? get error => _error;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    final hasToken = await _apiClient.hasToken();
    if (hasToken) {
      try {
        final response = await _apiClient.dio.get(ApiConstants.me);
        if (response.statusCode == 200 && response.data['user'] != null) {
          _user = UserModel.fromJson(response.data['user']);
          _isAuthenticated = true;
        } else {
          await _clearAuth();
        }
      } catch (e) {
        await _clearAuth();
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.post(ApiConstants.login, data: {
        'email': email.trim(),
        'password': password,
      });

      if (response.statusCode == 200) {
        final token = response.data['token'];
        await _apiClient.setToken(token);
        _user = UserModel.fromJson(response.data['user']);
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } on DioException catch (e) {
      _error = e.response?.data['error'] ?? 'Login failed. Please try again.';
    } catch (e) {
      _error = 'An unexpected error occurred.';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.post(ApiConstants.register, data: {
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
      });

      if (response.statusCode == 201) {
        final token = response.data['token'];
        await _apiClient.setToken(token);
        _user = UserModel.fromJson(response.data['user']);
        _isAuthenticated = true;

        // Update phone separately
        if (phone.trim().isNotEmpty) {
          try {
            await _apiClient.dio.put(ApiConstants.profile, data: {
              'phone': phone.trim(),
            });
          } catch (_) {}
        }

        _isLoading = false;
        notifyListeners();
        return true;
      }
    } on DioException catch (e) {
      _error =
          e.response?.data['error'] ?? 'Registration failed. Please try again.';
    } catch (e) {
      _error = 'An unexpected error occurred.';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> updateProfile({String? name, String? phone, String? address}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = <String, dynamic>{};
      if (name != null && name.trim().isNotEmpty) data['name'] = name.trim();
      if (phone != null && phone.trim().isNotEmpty) data['phone'] = phone.trim();
      if (address != null) data['address'] = address.trim();

      final response = await _apiClient.dio.put(ApiConstants.profile, data: data);
      if (response.data['success'] == true && response.data['user'] != null) {
        _user = UserModel.fromJson(response.data['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } on DioException catch (e) {
      _error = e.response?.data['message'] ?? 'Failed to update profile.';
    } catch (e) {
      _error = 'An unexpected error occurred.';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.put(
        ApiConstants.changePassword,
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      if (response.data['success'] == true) {
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } on DioException catch (e) {
      _error = e.response?.data['message'] ?? 'Failed to change password.';
    } catch (e) {
      _error = 'An unexpected error occurred.';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    await _clearAuth();
    notifyListeners();
  }

  Future<void> _clearAuth() async {
    await _apiClient.removeToken();
    _user = null;
    _isAuthenticated = false;
  }
}

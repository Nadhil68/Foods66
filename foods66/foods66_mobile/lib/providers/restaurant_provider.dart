import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../models/restaurant_model.dart';

class RestaurantProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<RestaurantModel> _restaurants = [];
  bool _isLoading = false;
  String? _error;

  List<RestaurantModel> get restaurants => _restaurants;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchRestaurants() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get(ApiConstants.restaurants);
      if (response.statusCode == 200) {
        final List data = response.data is List ? response.data : [];
        _restaurants =
            data.map((json) => RestaurantModel.fromJson(json)).toList();
      }
    } on DioException catch (e) {
      _error = e.response?.data?['message'] ?? 'Failed to load restaurants.';
    } catch (e) {
      _error = 'Failed to load restaurants.';
    }

    _isLoading = false;
    notifyListeners();
  }
}

import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../models/food_model.dart';

class FoodProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<FoodModel> _foods = [];
  List<String> _categories = [];
  String _selectedCategory = 'All';
  bool _isLoading = false;
  String? _error;

  List<FoodModel> get foods => _foods;
  List<String> get categories => _categories;
  String get selectedCategory => _selectedCategory;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<FoodModel> get filteredFoods {
    if (_selectedCategory == 'All') return _foods;
    return _foods.where((f) => f.category == _selectedCategory).toList();
  }

  Future<void> fetchFoods({String? category, String? search}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{};
      if (category != null && category != 'All') {
        queryParams['category'] = category;
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }

      final response = await _apiClient.dio.get(
        ApiConstants.foods,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final List data = response.data is List ? response.data : [];
        _foods = data.map((json) => FoodModel.fromJson(json)).toList();
        _extractCategories();
      }
    } on DioException catch (e) {
      _error = e.response?.data?['message'] ?? 'Failed to load foods.';
    } catch (e) {
      _error = 'Failed to load foods.';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<FoodModel?> fetchFoodById(String id) async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.foodById(id));
      if (response.statusCode == 200) {
        return FoodModel.fromJson(response.data);
      }
    } catch (e) {
      // Silently fail
    }
    return null;
  }

  Future<List<FoodModel>> searchFoods(String query) async {
    try {
      final response = await _apiClient.dio.get(
        ApiConstants.foods,
        queryParameters: {'search': query},
      );
      if (response.statusCode == 200) {
        final List data = response.data is List ? response.data : [];
        return data.map((json) => FoodModel.fromJson(json)).toList();
      }
    } catch (e) {
      // Silently fail
    }
    return [];
  }

  void selectCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void _extractCategories() {
    final categorySet = <String>{'All'};
    for (final food in _foods) {
      if (food.category.isNotEmpty) {
        categorySet.add(food.category);
      }
    }
    _categories = categorySet.toList();
  }
}

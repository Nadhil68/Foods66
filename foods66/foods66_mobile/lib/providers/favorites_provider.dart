import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../models/food_model.dart';

class FavoritesProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<FoodModel> _favorites = [];
  final Set<String> _favoritedIds = {};
  bool _isLoading = false;
  String? _error;

  List<FoodModel> get favorites => _favorites;
  bool get isLoading => _isLoading;
  String? get error => _error;

  bool isFavorited(String foodId) => _favoritedIds.contains(foodId);

  Future<void> fetchFavorites() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get(ApiConstants.favorites);
      if (response.statusCode == 200 && response.data['favorites'] != null) {
        final List data = response.data['favorites'];
        _favorites = data
            .where((f) => f['food'] != null)
            .map((f) => FoodModel.fromJson(f['food']))
            .toList();
        _favoritedIds.clear();
        for (final f in _favorites) {
          _favoritedIds.add(f.id);
        }
      }
    } on DioException catch (e) {
      _error = e.response?.data?['message'] ?? 'Failed to load favorites.';
    } catch (e) {
      _error = 'Failed to load favorites.';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> toggleFavorite(FoodModel food) async {
    final wasFavorited = _favoritedIds.contains(food.id);

    // Optimistic update
    if (wasFavorited) {
      _favoritedIds.remove(food.id);
      _favorites.removeWhere((f) => f.id == food.id);
    } else {
      _favoritedIds.add(food.id);
      _favorites.insert(0, food);
    }
    notifyListeners();

    try {
      if (wasFavorited) {
        await _apiClient.dio.delete(ApiConstants.removeFavorite(food.id));
      } else {
        await _apiClient.dio
            .post(ApiConstants.favorites, data: {'foodId': food.id});
      }
      return true;
    } catch (e) {
      // Revert on failure
      if (wasFavorited) {
        _favoritedIds.add(food.id);
        _favorites.insert(0, food);
      } else {
        _favoritedIds.remove(food.id);
        _favorites.removeWhere((f) => f.id == food.id);
      }
      notifyListeners();
      return false;
    }
  }
}

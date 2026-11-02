import 'package:flutter/material.dart';
import '../models/food_model.dart';

class CartItem {
  final String foodId;
  final String name;
  final double price;
  final String image;
  final String? category;
  int quantity;

  CartItem({
    required this.foodId,
    required this.name,
    required this.price,
    required this.image,
    this.category,
    this.quantity = 1,
  });

  double get lineTotal => price * quantity;

  Map<String, dynamic> toOrderItem() {
    return {
      'foodId': foodId,
      'quantity': quantity,
    };
  }
}

class CartProvider with ChangeNotifier {
  final Map<String, CartItem> _items = {};
  String? _couponCode;
  double _discountAmount = 0;

  Map<String, CartItem> get items => {..._items};
  List<CartItem> get itemList => _items.values.toList();
  int get itemCount => _items.length;
  int get totalQuantity =>
      _items.values.fold(0, (sum, item) => sum + item.quantity);
  String? get couponCode => _couponCode;
  double get discountAmount => _discountAmount;

  double get subtotal {
    return _items.values.fold(0.0, (sum, item) => sum + item.lineTotal);
  }

  double get deliveryFee => _items.isEmpty ? 0 : 40;

  double get tax {
    final taxableAmount = (subtotal - _discountAmount).clamp(0, double.infinity);
    return (taxableAmount * 0.05).roundToDouble();
  }

  double get totalAmount {
    return ((subtotal - _discountAmount).clamp(0, double.infinity) +
            deliveryFee +
            tax)
        .clamp(0, double.infinity);
  }

  bool get isEmpty => _items.isEmpty;

  void addItem(FoodModel food) {
    if (_items.containsKey(food.id)) {
      _items[food.id]!.quantity++;
    } else {
      _items[food.id] = CartItem(
        foodId: food.id,
        name: food.name,
        price: food.price,
        image: food.image,
        category: food.category,
      );
    }
    notifyListeners();
  }

  void addItemDirect(String foodId, String name, double price, String image) {
    if (_items.containsKey(foodId)) {
      _items[foodId]!.quantity++;
    } else {
      _items[foodId] = CartItem(
        foodId: foodId,
        name: name,
        price: price,
        image: image,
      );
    }
    notifyListeners();
  }

  void removeItem(String foodId) {
    _items.remove(foodId);
    if (_items.isEmpty) _clearCoupon();
    notifyListeners();
  }

  void incrementQuantity(String foodId) {
    if (_items.containsKey(foodId)) {
      _items[foodId]!.quantity++;
      notifyListeners();
    }
  }

  void decrementQuantity(String foodId) {
    if (!_items.containsKey(foodId)) return;
    if (_items[foodId]!.quantity > 1) {
      _items[foodId]!.quantity--;
    } else {
      _items.remove(foodId);
    }
    if (_items.isEmpty) _clearCoupon();
    notifyListeners();
  }

  void applyCoupon(String code, double discount) {
    _couponCode = code;
    _discountAmount = discount;
    notifyListeners();
  }

  void _clearCoupon() {
    _couponCode = null;
    _discountAmount = 0;
  }

  void removeCoupon() {
    _clearCoupon();
    notifyListeners();
  }

  List<Map<String, dynamic>> toOrderItems() {
    return _items.values.map((item) => item.toOrderItem()).toList();
  }

  void clear() {
    _items.clear();
    _clearCoupon();
    notifyListeners();
  }
}

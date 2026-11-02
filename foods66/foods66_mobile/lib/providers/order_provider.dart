import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../models/order_model.dart';

class OrderProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<OrderModel> _orders = [];
  OrderModel? _currentOrder;
  bool _isLoading = false;
  String? _error;

  List<OrderModel> get orders => _orders;
  OrderModel? get currentOrder => _currentOrder;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<OrderModel> get activeOrders =>
      _orders.where((o) => o.isActive).toList();

  List<OrderModel> get pastOrders =>
      _orders.where((o) => !o.isActive).toList();

  Future<void> fetchOrders() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get(ApiConstants.orders);
      if (response.statusCode == 200 && response.data['orders'] != null) {
        final List data = response.data['orders'];
        _orders = data.map((json) => OrderModel.fromJson(json)).toList();
      }
    } on DioException catch (e) {
      _error = e.response?.data?['message'] ?? 'Failed to load orders.';
    } catch (e) {
      _error = 'Failed to load orders.';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<OrderModel?> fetchOrderById(String id) async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.orderById(id));
      if (response.statusCode == 200 && response.data['order'] != null) {
        _currentOrder = OrderModel.fromJson(response.data['order']);
        notifyListeners();
        return _currentOrder;
      }
    } catch (e) {
      // Silently fail
    }
    return null;
  }

  /// Create a new order via the payments endpoint (handles both COD and Card)
  Future<Map<String, dynamic>?> createOrder({
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> deliveryAddress,
    String paymentMethod = 'COD',
    String? couponCode,
    String? specialInstructions,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = {
        'items': items,
        'deliveryAddress': deliveryAddress,
        'paymentMethod': paymentMethod,
        'idempotencyKey': 'mobile_${DateTime.now().millisecondsSinceEpoch}',
      };
      if (couponCode != null && couponCode.isNotEmpty) {
        data['couponCode'] = couponCode;
      }
      if (specialInstructions != null && specialInstructions.isNotEmpty) {
        data['specialInstructions'] = specialInstructions;
      }

      final response = await _apiClient.dio.post(
        ApiConstants.createPaymentSession,
        data: data,
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        _isLoading = false;
        notifyListeners();
        return response.data;
      }
    } on DioException catch (e) {
      _error = e.response?.data?['message'] ?? 'Failed to create order.';
    } catch (e) {
      _error = 'Failed to create order.';
    }

    _isLoading = false;
    notifyListeners();
    return null;
  }

  /// Cancel an order
  Future<bool> cancelOrder(String orderId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.put(
        ApiConstants.orderStatus(orderId),
        data: {'status': 'CANCELLED', 'note': 'Cancelled by customer'},
      );
      if (response.data['success'] == true) {
        await fetchOrders();
        return true;
      }
    } on DioException catch (e) {
      _error = e.response?.data?['message'] ?? 'Failed to cancel order.';
    } catch (e) {
      _error = 'Failed to cancel order.';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }
}

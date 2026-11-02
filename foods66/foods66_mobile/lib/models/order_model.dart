class OrderItemModel {
  final String foodId;
  final String name;
  final double price;
  final int quantity;
  final String? image;
  final String? category;

  OrderItemModel({
    required this.foodId,
    required this.name,
    required this.price,
    required this.quantity,
    this.image,
    this.category,
  });

  double get lineTotal => price * quantity;

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      foodId: json['foodId'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      image: json['image'],
      category: json['category'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'foodId': foodId,
      'name': name,
      'price': price,
      'quantity': quantity,
      'image': image,
      'category': category,
    };
  }
}

class OrderTimelineEntry {
  final String status;
  final DateTime timestamp;
  final String? note;
  final String? actor;

  OrderTimelineEntry({
    required this.status,
    required this.timestamp,
    this.note,
    this.actor,
  });

  factory OrderTimelineEntry.fromJson(Map<String, dynamic> json) {
    return OrderTimelineEntry(
      status: json['status'] ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      note: json['note'],
      actor: json['actor'],
    );
  }
}

class DeliveryAddressModel {
  final String fullAddress;
  final String? doorNo;
  final String? landmark;
  final String? district;
  final String? city;
  final String? state;
  final String? pincode;
  final double? lat;
  final double? lng;

  DeliveryAddressModel({
    required this.fullAddress,
    this.doorNo,
    this.landmark,
    this.district,
    this.city,
    this.state,
    this.pincode,
    this.lat,
    this.lng,
  });

  factory DeliveryAddressModel.fromJson(Map<String, dynamic> json) {
    return DeliveryAddressModel(
      fullAddress: json['fullAddress'] ?? '',
      doorNo: json['doorNo'],
      landmark: json['landmark'],
      district: json['district'],
      city: json['city'],
      state: json['state'],
      pincode: json['pincode'],
      lat: json['lat']?.toDouble(),
      lng: json['lng']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fullAddress': fullAddress,
      'doorNo': doorNo ?? '',
      'landmark': landmark ?? '',
      'district': district ?? '',
      'city': city ?? '',
      'state': state ?? '',
      'pincode': pincode ?? '',
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
    };
  }
}

class OrderModel {
  final String id;
  final String userId;
  final List<OrderItemModel> items;
  final double subtotal;
  final double deliveryFee;
  final double tax;
  final double discountAmount;
  final String? couponCode;
  final double totalPrice;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final DeliveryAddressModel? deliveryAddress;
  final String? deliveryPartnerName;
  final String? deliveryPartnerPhone;
  final List<OrderTimelineEntry> timeline;
  final String? specialInstructions;
  final DateTime createdAt;
  final DateTime updatedAt;

  OrderModel({
    required this.id,
    required this.userId,
    required this.items,
    required this.subtotal,
    required this.deliveryFee,
    required this.tax,
    required this.discountAmount,
    this.couponCode,
    required this.totalPrice,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    this.deliveryAddress,
    this.deliveryPartnerName,
    this.deliveryPartnerPhone,
    required this.timeline,
    this.specialInstructions,
    required this.createdAt,
    required this.updatedAt,
  });

  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  bool get canCancel =>
      status == 'PLACED' ||
      status == 'PAYMENT_PENDING' ||
      status == 'PAYMENT_CONFIRMED';

  bool get isActive =>
      status != 'DELIVERED' &&
      status != 'CANCELLED' &&
      status != 'REFUNDED';

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['_id']?.toString() ?? '',
      userId: json['userId'] ?? '',
      items: (json['items'] as List?)
              ?.map((e) => OrderItemModel.fromJson(e))
              .toList() ??
          [],
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      deliveryFee: (json['deliveryFee'] ?? 0).toDouble(),
      tax: (json['tax'] ?? 0).toDouble(),
      discountAmount: (json['discountAmount'] ?? 0).toDouble(),
      couponCode: json['couponCode'],
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      status: json['status'] ?? 'PLACED',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      paymentMethod: json['paymentMethod'] ?? 'COD',
      deliveryAddress: json['deliveryAddress'] != null
          ? DeliveryAddressModel.fromJson(json['deliveryAddress'])
          : null,
      deliveryPartnerName: json['deliveryPartnerName'],
      deliveryPartnerPhone: json['deliveryPartnerPhone'],
      timeline: (json['timeline'] as List?)
              ?.map((e) => OrderTimelineEntry.fromJson(e))
              .toList() ??
          [],
      specialInstructions: json['specialInstructions'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }
}

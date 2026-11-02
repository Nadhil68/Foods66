class FoodModel {
  final String id;
  final String name;
  final String description;
  final double price;
  final double? originalPrice;
  final String category;
  final String image;
  final bool available;
  final int stock;

  FoodModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.originalPrice,
    required this.category,
    required this.image,
    required this.available,
    this.stock = 100,
  });

  bool get hasDiscount => originalPrice != null && originalPrice! > price;

  factory FoodModel.fromJson(Map<String, dynamic> json) {
    return FoodModel(
      id: json['_id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      originalPrice: json['originalPrice'] != null
          ? (json['originalPrice']).toDouble()
          : null,
      category: json['category'] ?? '',
      image: json['image'] ?? '',
      available: json['available'] ?? false,
      stock: json['stock'] ?? 100,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'price': price,
      'originalPrice': originalPrice,
      'category': category,
      'image': image,
      'available': available,
      'stock': stock,
    };
  }
}

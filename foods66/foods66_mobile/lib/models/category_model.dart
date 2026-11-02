class CategoryModel {
  final String id;
  final String name;
  final String image;
  final String description;
  final bool isActive;

  CategoryModel({
    required this.id,
    required this.name,
    required this.image,
    this.description = '',
    this.isActive = true,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['_id']?.toString() ?? '',
      name: json['name'] ?? '',
      image: json['image'] ?? '',
      description: json['description'] ?? '',
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'image': image,
      'description': description,
      'isActive': isActive,
    };
  }
}

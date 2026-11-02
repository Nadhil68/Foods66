class RestaurantModel {
  final String id;
  final String userId;
  final String name;
  final String description;
  final String address;
  final String phone;
  final double rating;
  final String verificationStatus;
  final String liveStatus;

  RestaurantModel({
    required this.id,
    required this.userId,
    required this.name,
    this.description = '',
    required this.address,
    required this.phone,
    this.rating = 0,
    this.verificationStatus = 'pending',
    this.liveStatus = 'closed',
  });

  bool get isOpen => liveStatus == 'open';
  bool get isVerified => verificationStatus == 'verified';

  factory RestaurantModel.fromJson(Map<String, dynamic> json) {
    return RestaurantModel(
      id: json['_id']?.toString() ?? '',
      userId: json['userId'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      address: json['address'] ?? '',
      phone: json['phone'] ?? '',
      rating: (json['rating'] ?? 0).toDouble(),
      verificationStatus: json['verificationStatus'] ?? 'pending',
      liveStatus: json['liveStatus'] ?? 'closed',
    );
  }
}

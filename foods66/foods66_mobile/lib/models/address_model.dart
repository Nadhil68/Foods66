class AddressModel {
  final String id;
  final String label;
  final String fullAddress;
  final String doorNo;
  final String landmark;
  final String district;
  final String city;
  final String state;
  final String pincode;
  final double? lat;
  final double? lng;

  AddressModel({
    required this.id,
    this.label = 'Home',
    required this.fullAddress,
    this.doorNo = '',
    this.landmark = '',
    this.district = '',
    this.city = '',
    this.state = '',
    this.pincode = '',
    this.lat,
    this.lng,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['_id']?.toString() ?? '',
      label: json['label'] ?? 'Home',
      fullAddress: json['fullAddress'] ?? '',
      doorNo: json['doorNo'] ?? '',
      landmark: json['landmark'] ?? '',
      district: json['district'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      lat: json['lat']?.toDouble(),
      lng: json['lng']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'label': label,
      'fullAddress': fullAddress,
      'doorNo': doorNo,
      'landmark': landmark,
      'district': district,
      'city': city,
      'state': state,
      'pincode': pincode,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
    };
  }
}

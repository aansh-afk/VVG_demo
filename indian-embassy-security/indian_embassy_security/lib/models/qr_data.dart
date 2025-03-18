class QRData {
  final String userId;
  final String eventId;
  String? displayName; // This will be fetched from Firestore
  String? photoURL; // This will be fetched from Firestore

  QRData({
    required this.userId,
    required this.eventId,
    this.displayName,
    this.photoURL,
  });

  factory QRData.fromJson(Map<String, dynamic> json) {
    return QRData(
      userId: json['userId'] as String,
      eventId: json['eventId'] as String,
      displayName: json['displayName'],
      photoURL: json['photoURL'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'eventId': eventId,
      if (displayName != null) 'displayName': displayName,
      if (photoURL != null) 'photoURL': photoURL,
    };
  }
}
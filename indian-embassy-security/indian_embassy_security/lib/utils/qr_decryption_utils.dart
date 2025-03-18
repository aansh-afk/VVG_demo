import 'dart:convert';
import '../models/qr_data.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// Utility class for QR code data processing
class QRDecryptionUtils {
  /// Process QR code data - decode base64 and parse JSON
  static Future<QRData> decodeQRData(String encodedData) async {
    try {
      print('Decoding QR data: ${encodedData.length > 50 ? encodedData.substring(0, 50) + '...' : encodedData}');
      
      // Decode base64
      final String jsonString = utf8.decode(base64Decode(encodedData));
      
      // Parse JSON
      final Map<String, dynamic> json = jsonDecode(jsonString);
      
      // Create QR data object
      final QRData qrData = QRData.fromJson(json);
      print('Successfully decoded QR data: ${qrData.toJson()}');
      
      return qrData;
    } catch (e) {
      print('Error decoding QR data: $e');
      throw FormatException('Invalid QR code format: $e');
    }
  }
  
  /// Verify QR code with Firestore for a specific event
  static Future<Map<String, dynamic>> verifyQRCodeWithFirestore(
    String userId, 
    String eventId
  ) async {
    try {
      print('Verifying user $userId for event $eventId');
      
      // Get event data
      final DocumentSnapshot eventDoc = await FirebaseFirestore.instance
          .collection('events')
          .doc(eventId)
          .get();
          
      if (!eventDoc.exists) {
        return {
          'valid': false,
          'reason': 'Event not found',
        };
      }
      
      // Check if user is in attendees list
      final Map<String, dynamic> eventData = eventDoc.data() as Map<String, dynamic>;
      final List<dynamic> attendees = eventData['attendees'] ?? [];
      
      if (!attendees.contains(userId)) {
        return {
          'valid': false,
          'reason': 'User is not registered for this event',
        };
      }
      
      // Get user data
      final DocumentSnapshot userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();
          
      if (!userDoc.exists) {
        return {
          'valid': true,
          'userData': {
            'displayName': 'Unknown User',
            'photoURL': '',
            'userId': userId,
          },
        };
      }
      
      // Return success with user details
      final Map<String, dynamic> userData = userDoc.data() as Map<String, dynamic>;
      return {
        'valid': true,
        'userData': {
          'displayName': userData['displayName'] ?? 'Unknown User',
          'photoURL': userData['photoURL'] ?? '',
          'email': userData['email'] ?? '',
          'userId': userId,
        },
      };
    } catch (e) {
      print('Error verifying QR code with Firestore: $e');
      return {
        'valid': false,
        'reason': 'Error verifying attendance: $e',
      };
    }
  }
  
  /// Get all events from Firestore
  static Future<List<Map<String, dynamic>>> getAllEvents() async {
    try {
      final QuerySnapshot eventsSnapshot = await FirebaseFirestore.instance
          .collection('events')
          .orderBy('datetime', descending: true)
          .get();
      
      final List<Map<String, dynamic>> events = [];
      for (var doc in eventsSnapshot.docs) {
        final Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        
        // Convert Timestamp to DateTime
        final Timestamp timestamp = data['datetime'] as Timestamp;
        final DateTime datetime = timestamp.toDate();
        
        events.add({
          'id': doc.id,
          'title': data['title'] ?? 'Untitled Event',
          'datetime': datetime,
          'location': data['location'] ?? 'Unknown Location',
          'attendees': data['attendees'] ?? [],
        });
      }
      
      return events;
    } catch (e) {
      print('Error getting events: $e');
      return [];
    }
  }
}
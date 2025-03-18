import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Auto login with predefined credentials
  Future<UserCredential> autoLogin() async {
    try {
      return await _auth.signInWithEmailAndPassword(
        email: 'security@email.com',
        password: '123456',
      );
    } catch (e) {
      print('Auto login error: $e');
      rethrow;
    }
  }

  // Get current user
  User? get currentUser => _auth.currentUser;

  // Get user data from Firestore
  Future<Map<String, dynamic>?> getUserData() async {
    try {
      if (currentUser != null) {
        DocumentSnapshot doc = await _firestore.collection('securityStaff').doc(currentUser!.uid).get();
        if (doc.exists) {
          return doc.data() as Map<String, dynamic>?;
        }
        // If not found in securityStaff, try users collection
        doc = await _firestore.collection('users').doc(currentUser!.uid).get();
        if (doc.exists) {
          return doc.data() as Map<String, dynamic>?;
        }
      }
      return null;
    } catch (e) {
      print('Error getting user data: $e');
      return null;
    }
  }

  // Sign out
  Future<void> signOut() async {
    return await _auth.signOut();
  }
}
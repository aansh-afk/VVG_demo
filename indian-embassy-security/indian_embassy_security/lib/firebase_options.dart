// File generated by FlutterFire CLI.
// ignore_for_file: lines_longer_than_80_chars, avoid_classes_with_only_static_members
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAs9R4GCtM4HpBu1HPwWkheb-Kwrq3dRGM',
    appId: '1:368274571752:web:401ba64938848ca261e45d',
    messagingSenderId: '368274571752',
    projectId: 'indian-embassy-c4aad',
    authDomain: 'indian-embassy-c4aad.firebaseapp.com',
    storageBucket: 'indian-embassy-c4aad.firebasestorage.app',
    measurementId: 'G-HQ1VKVRSTB',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAs9R4GCtM4HpBu1HPwWkheb-Kwrq3dRGM',
    appId: '1:368274571752:android:401ba64938848ca261e45d',
    messagingSenderId: '368274571752',
    projectId: 'indian-embassy-c4aad',
    storageBucket: 'indian-embassy-c4aad.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAs9R4GCtM4HpBu1HPwWkheb-Kwrq3dRGM',
    appId: '1:368274571752:ios:401ba64938848ca261e45d',
    messagingSenderId: '368274571752',
    projectId: 'indian-embassy-c4aad',
    storageBucket: 'indian-embassy-c4aad.firebasestorage.app',
    iosBundleId: 'com.example.indian_embassy_security',
  );
}
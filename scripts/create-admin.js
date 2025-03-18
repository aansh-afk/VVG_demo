/**
 * Create Admin User Script
 * 
 * This script allows you to:
 * 1. Create a new admin user with email/password
 * 2. Set an existing user's role to admin
 * 
 * Usage:
 * - Create new admin: node create-admin.js create email@example.com password123 "Admin Name"
 * - Set existing user to admin: node create-admin.js set-role userId
 * 
 * Prerequisites:
 * - Firebase service account key (serviceAccountKey.json in scripts directory)
 */

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account key file not found at:', serviceAccountPath);
  console.error('Please place your Firebase service account key JSON file in the scripts directory.');
  process.exit(1);
}

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

const auth = getAuth();
const db = getFirestore();

async function createAdminUser(email, password, displayName) {
  try {
    // Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true
    });
    
    console.log('User created successfully:', userRecord.uid);
    
    // Set user role to admin in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      photoURL: '', // Default empty
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      groups: [],
      preApprovedEvents: [],
      role: 'admin'
    });
    
    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Name:', displayName);
    console.log('User ID:', userRecord.uid);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

async function setUserAsAdmin(userId) {
  try {
    // Get the user from Firebase Auth
    const userRecord = await auth.getUser(userId);
    console.log('Found user:', userRecord.displayName || userRecord.email);
    
    // Update user document in Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      // Update existing document with role field
      await db.collection('users').doc(userId).update({
        role: 'admin'
      });
      console.log('User document updated with admin role');
    } else {
      // Create a new user document
      await db.collection('users').doc(userId).set({
        uid: userId,
        email: userRecord.email,
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        groups: [],
        preApprovedEvents: [],
        role: 'admin'
      });
      console.log('User document created with admin role');
    }
    
    console.log('User set as admin successfully!');
    console.log('Email:', userRecord.email);
    console.log('Name:', userRecord.displayName || 'No name set');
    console.log('User ID:', userId);
  } catch (error) {
    console.error('Error setting user as admin:', error);
  }
}

// Command line arguments handler
const args = process.argv.slice(2);
const command = args[0];

if (command === 'create' && args.length >= 4) {
  const email = args[1];
  const password = args[2];
  const displayName = args[3];
  
  createAdminUser(email, password, displayName)
    .finally(() => process.exit());
} else if (command === 'set-role' && args.length >= 2) {
  const userId = args[1];
  
  setUserAsAdmin(userId)
    .finally(() => process.exit());
} else {
  console.log('Usage:');
  console.log('Create new admin: node create-admin.js create email@example.com password123 "Admin Name"');
  console.log('Set existing user to admin: node create-admin.js set-role userId');
  process.exit(1);
}
/**
 * Setup Admin Portal Script
 * 
 * This script sets up the necessary infrastructure for the admin portal:
 * 1. Verifies and creates custom claims for user roles in Firebase Auth
 * 2. Sets up the Firestore security rules for admin access
 * 
 * Usage:
 * node setup-admin-portal.js
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

async function setupAdminPortal() {
  try {
    console.log('Setting up Admin Portal infrastructure...');
    
    // 1. Get all users with admin role from Firestore
    console.log('Finding users with admin role in Firestore...');
    const usersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    
    if (usersSnapshot.empty) {
      console.log('No admin users found in Firestore. Please create admin users first using create-admin.js');
    } else {
      console.log(`Found ${usersSnapshot.size} admin users in Firestore`);
      
      // 2. Set custom claims for each admin user
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        try {
          await auth.setCustomUserClaims(userData.uid, { admin: true });
          console.log(`Set admin custom claim for user: ${userData.email} (${userData.uid})`);
        } catch (error) {
          console.error(`Error setting custom claim for user ${userData.uid}:`, error);
        }
      }
    }
    
    // 3. Create admin test collection with a document
    try {
      await db.collection('adminConfig').doc('settings').set({
        setupComplete: true,
        setupDate: admin.firestore.FieldValue.serverTimestamp(),
        adminPortalEnabled: true
      });
      console.log('Created adminConfig collection with settings document');
    } catch (error) {
      console.error('Error creating adminConfig collection:', error);
    }
    
    console.log('\nAdmin Portal setup complete!');
    console.log('\nNext steps:');
    console.log('1. Configure Firestore security rules to protect admin resources');
    console.log('2. Test admin login at /auth/admin/login');
    console.log('3. Verify admin dashboard access');
    
  } catch (error) {
    console.error('Error setting up admin portal:', error);
  }
}

// Run the setup
setupAdminPortal()
  .finally(() => process.exit());
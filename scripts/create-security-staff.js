/**
 * This script creates a security staff user in Firebase Authentication and Firestore.
 * It also sets the custom claim for security staff access.
 * 
 * Usage:
 * - Make sure the serviceAccountKey.json file is in the scripts directory
 * - Run: node scripts/create-security-staff.js <email> <password> <displayName>
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found in scripts directory');
  console.error('Please ensure your Firebase service account key is placed in the scripts directory');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createSecurityUser(email, password, displayName) {
  try {
    // Check if required parameters are provided
    if (!email || !password || !displayName) {
      console.error('Usage: node scripts/create-security-staff.js <email> <password> <displayName>');
      process.exit(1);
    }

    console.log(`Creating security staff user: ${email}`);

    // Step 1: Create the user in Firebase Authentication
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
      console.log(`Successfully created new user: ${userRecord.uid}`);
    } catch (error) {
      // Check if user already exists
      if (error.code === 'auth/email-already-exists') {
        console.log(`User with email ${email} already exists. Getting user record...`);
        userRecord = await auth.getUserByEmail(email);
        console.log(`Found existing user: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Step 2: Set custom claim for security staff access
    await auth.setCustomUserClaims(userRecord.uid, { security: true });
    console.log(`Successfully set security custom claim for user: ${userRecord.uid}`);

    // Step 3: Create user document in Firestore with security role
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userData = {
      uid: userRecord.uid,
      email,
      displayName,
      role: 'security',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      groups: []
    };

    // Get existing user doc if it exists, to avoid overwriting any data
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
      console.log(`User document already exists, updating role to security`);
      await userDocRef.update({
        role: 'security',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await userDocRef.set(userData);
    }
    console.log(`Successfully created/updated user document in Firestore`);

    // Step 4: Create a security staff document
    await db.collection('securityStaff').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      scanCount: 0,
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Successfully created security staff document in Firestore`);

    console.log(`✅ Successfully set up security staff user: ${email}`);
    console.log(`Security staff can now log in at: /auth/security/login`);

  } catch (error) {
    console.error('Error creating security staff user:', error);
    process.exit(1);
  }
}

// Get command line arguments (email, password, displayName)
const email = process.argv[2];
const password = process.argv[3];
const displayName = process.argv[4];

createSecurityUser(email, password, displayName)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
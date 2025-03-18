/**
 * Deploy Security Rules Script
 * 
 * This script deploys the Firestore security rules to your Firebase project.
 * 
 * Usage:
 * node deploy-security-rules.js
 * 
 * Prerequisites:
 * - Firebase service account key (serviceAccountKey.json in scripts directory)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Check if firebase-tools is installed
console.log('Checking if firebase-tools is installed...');
try {
  execSync('npx firebase --version', { stdio: 'inherit' });
} catch (error) {
  console.error('firebase-tools is not installed. Installing it now...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
  } catch (installError) {
    console.error('Failed to install firebase-tools:', installError);
    process.exit(1);
  }
}

// Deploy the security rules
console.log('Deploying Firestore security rules...');
try {
  // Get the project ID from the service account
  const projectId = require(serviceAccountPath).project_id;
  console.log(`Deploying to project: ${projectId}`);
  
  // Deploy the rules
  execSync(`npx firebase deploy --only firestore:rules --project ${projectId}`, { 
    stdio: 'inherit'
  });
  
  console.log('\nFirestore security rules deployed successfully!');
} catch (error) {
  console.error('Failed to deploy security rules:', error);
  process.exit(1);
}
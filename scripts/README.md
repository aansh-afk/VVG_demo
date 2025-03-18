# Admin User Management Scripts

This directory contains utility scripts for managing admin users, setting up the admin portal, and configuring security for the Indian Embassy Portal.

## Prerequisites for All Scripts

Before using any script, you need to have the Firebase Admin SDK service account key:

1. Go to the Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `serviceAccountKey.json` in this `scripts` directory
4. Install required packages with `npm install firebase-admin`
5. For deployment scripts, you'll need Firebase CLI: `npm install -g firebase-tools`

## Create Admin User Script

The `create-admin.js` script allows you to:
1. Create a new admin user with email/password
2. Set an existing user's role to admin

### Usage

#### Create a new admin user

```bash
node create-admin.js create email@example.com password123 "Admin Name"
```

This will:
- Create a new user in Firebase Authentication
- Create a corresponding document in the Firestore `users` collection
- Set the `role` field to `admin`

#### Set an existing user as admin

```bash
node create-admin.js set-role userId
```

This will:
- Find the user in Firebase Authentication
- Update their document in Firestore to have the `role` field set to `admin`
- If the user doesn't have a document in Firestore, one will be created

## Setup Admin Portal Script

The `setup-admin-portal.js` script configures the necessary infrastructure for the admin portal:

```bash
node setup-admin-portal.js
```

This script:
1. Finds all users with admin role in Firestore
2. Sets custom claims for these users in Firebase Authentication
3. Creates an adminConfig collection with settings
4. Provides next steps for completing the setup

Run this script after creating admin users with the `create-admin.js` script to fully set up the admin portal infrastructure.

## Deploy Security Rules Script

The `deploy-security-rules.js` script deploys the Firestore security rules to your Firebase project:

```bash
node deploy-security-rules.js
```

This script:
1. Uses your service account key to identify the Firebase project
2. Deploys the security rules defined in `firestore.rules` to your project
3. Ensures the admin-specific collections and operations are properly secured

## Implementation Process

For setting up admin functionality, follow these steps:

1. Generate and download the service account key to `scripts/serviceAccountKey.json`
2. Create an admin user using `create-admin.js`
3. Set up the admin portal infrastructure using `setup-admin-portal.js`
4. Deploy security rules using `deploy-security-rules.js`
5. Test the admin login at `/auth/admin/login`
6. Verify admin dashboard access

## Troubleshooting

If you encounter errors:

1. Verify that the `serviceAccountKey.json` file is correctly placed in the scripts directory
2. Make sure the service account has the necessary permissions (Firebase Admin)
3. Ensure the user ID is valid when using the `set-role` command
4. Check Firebase console logs for authentication issues
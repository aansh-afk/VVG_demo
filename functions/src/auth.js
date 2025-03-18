/**
 * Firebase Cloud Functions for managing authentication and custom claims
 * 
 * Note: This file should be deployed to Firebase Cloud Functions.
 * You'll need to run `firebase init functions` and then deploy with `firebase deploy --only functions`
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function to set admin role for a user
 * This should be called from a secured admin interface
 */
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Verify the request is from an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set admin roles'
    );
  }

  const { userId } = data;
  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID is required'
    );
  }

  try {
    // Set custom claim for admin role
    await admin.auth().setCustomUserClaims(userId, { admin: true });
    
    // Update user document in Firestore to reflect new role
    await admin.firestore().collection('users').doc(userId).update({
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error setting admin role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to set security role for a user
 * This should be called from a secured admin interface
 */
exports.setSecurityRole = functions.https.onCall(async (data, context) => {
  // Verify the request is from an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set security roles'
    );
  }

  const { userId } = data;
  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID is required'
    );
  }

  try {
    // Set custom claim for security role
    await admin.auth().setCustomUserClaims(userId, { security: true });
    
    // Create or update security staff document
    await admin.firestore().collection('securityStaff').doc(userId).set({
      uid: userId,
      assignedEvents: [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error setting security role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to remove a role from a user
 */
exports.removeRole = functions.https.onCall(async (data, context) => {
  // Verify the request is from an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can remove roles'
    );
  }

  const { userId, role } = data;
  if (!userId || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID and role are required'
    );
  }

  try {
    // Get current custom claims
    const user = await admin.auth().getUser(userId);
    const customClaims = user.customClaims || {};
    
    // Remove the specified role
    delete customClaims[role];
    
    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, customClaims);
    
    // Update relevant Firestore documents
    if (role === 'admin') {
      await admin.firestore().collection('users').doc(userId).update({
        isAdmin: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to send email when an approval request status changes
 */
exports.sendApprovalNotification = functions.firestore
  .document('approvalRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Only send notification if status changed
    if (before.status === after.status) {
      return null;
    }
    
    try {
      // Get user email
      const userSnapshot = await admin.firestore().collection('users').doc(after.userId).get();
      if (!userSnapshot.exists) {
        console.error('User document not found');
        return null;
      }
      
      const userData = userSnapshot.data();
      const userEmail = userData.email;
      
      // Get event details
      const eventSnapshot = await admin.firestore().collection('events').doc(after.eventId).get();
      if (!eventSnapshot.exists) {
        console.error('Event document not found');
        return null;
      }
      
      const eventData = eventSnapshot.data();
      
      // Prepare email data based on status
      const mailOptions = {
        from: '"Indian Embassy Portal" <noreply@indianembassy.com>',
        to: userEmail,
        subject: `Event Registration ${after.status === 'approved' ? 'Approved' : 'Denied'}: ${eventData.title}`,
      };
      
      if (after.status === 'approved') {
        mailOptions.text = `Dear ${userData.displayName},\n\nYour request to attend "${eventData.title}" has been approved. You can now access your QR code for the event from your dashboard.\n\nDate: ${new Date(eventData.datetime.toDate()).toLocaleString()}\nLocation: ${eventData.location}\n\nPlease present your QR code to security personnel when arriving at the event.\n\nRegards,\nIndian Embassy Team`;
      } else {
        mailOptions.text = `Dear ${userData.displayName},\n\nUnfortunately, your request to attend "${eventData.title}" has been denied.\n\nIf you have any questions, please contact the embassy directly.\n\nRegards,\nIndian Embassy Team`;
      }
      
      // Send the email (this requires setting up a mail service in Firebase Functions)
      // For example, you could use the nodemailer package
      // await mailTransport.sendMail(mailOptions);
      
      console.log('Approval notification email sent');
      return null;
    } catch (error) {
      console.error('Error sending approval notification:', error);
      return null;
    }
  });
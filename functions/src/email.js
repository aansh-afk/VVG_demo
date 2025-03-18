/**
 * Firebase Cloud Functions for sending emails
 * 
 * Note: This file should be deployed to Firebase Cloud Functions.
 * You'll need to run `firebase init functions` and then deploy with `firebase deploy --only functions`
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize the Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configure the email transport
// For production, you should use a proper email service
// This is a development configuration using Gmail
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password,
  },
});

/**
 * Send an approval request notification email to admins
 */
exports.sendApprovalRequestNotification = functions.firestore
  .document('approvalRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const requestData = snapshot.data();
    
    try {
      // Get user data
      const userSnapshot = await admin.firestore().collection('users').doc(requestData.userId).get();
      if (!userSnapshot.exists) {
        console.error('User document not found');
        return null;
      }
      
      const userData = userSnapshot.data();
      
      // Get event data
      const eventSnapshot = await admin.firestore().collection('events').doc(requestData.eventId).get();
      if (!eventSnapshot.exists) {
        console.error('Event document not found');
        return null;
      }
      
      const eventData = eventSnapshot.data();
      
      // Get admin emails (query users with admin claim)
      const adminUsersSnapshot = await admin.firestore().collection('users')
        .where('isAdmin', '==', true)
        .get();
      
      if (adminUsersSnapshot.empty) {
        console.log('No admin users found');
        return null;
      }
      
      const adminEmails = [];
      adminUsersSnapshot.forEach(doc => {
        adminEmails.push(doc.data().email);
      });
      
      // Prepare email data
      const mailOptions = {
        from: '"Indian Embassy Portal" <noreply@indianembassy.com>',
        to: adminEmails.join(','),
        subject: `New Approval Request: ${eventData.title}`,
        text: `A new approval request has been submitted:
        
User: ${userData.displayName} (${userData.email})
Event: ${eventData.title}
Date: ${new Date(eventData.datetime.toDate()).toLocaleString()}
Requested at: ${new Date(requestData.requestedAt.toDate()).toLocaleString()}

Please log in to the admin portal to approve or deny this request.

Indian Embassy Portal`,
      };
      
      // Send the email
      await mailTransport.sendMail(mailOptions);
      
      console.log('Approval request notification email sent to admins');
      return null;
    } catch (error) {
      console.error('Error sending approval request notification:', error);
      return null;
    }
  });

/**
 * Send a welcome email to new users
 */
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  try {
    const mailOptions = {
      from: '"Indian Embassy Portal" <noreply@indianembassy.com>',
      to: user.email,
      subject: 'Welcome to the Indian Embassy Portal',
      text: `Dear ${user.displayName || 'Guest'},

Welcome to the Indian Embassy Portal! We're delighted to have you join our community.

With your new account, you can:
- Browse and register for embassy events
- Receive QR codes for easy check-in
- Manage your profile and event registrations

If you have any questions or need assistance, please don't hesitate to contact us.

Regards,
Indian Embassy Team`,
    };
    
    await mailTransport.sendMail(mailOptions);
    
    console.log('Welcome email sent to:', user.email);
    return null;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return null;
  }
});
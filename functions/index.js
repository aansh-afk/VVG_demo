/**
 * Cloud Functions for Indian Embassy Portal
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Verify QR code for event check-in
 * Used by security staff to validate attendees
 */
exports.verifyQRCode = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated as security staff
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", 
      "You must be logged in to verify QR codes"
    );
  }

  const { encodedData, eventId } = data;
  
  if (!encodedData || !eventId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Required parameters: encodedData, eventId"
    );
  }

  try {
    // First verify the security staff is authorized
    const securityStaffRef = admin.firestore().collection("securityStaff").doc(context.auth.uid);
    const securityStaffDoc = await securityStaffRef.get();
    
    const isSecurityStaff = securityStaffDoc.exists;
    const isSecurityRole = context.auth.token.security === true;
    
    if (!isSecurityStaff && !isSecurityRole) {
      // Also check user record for security role as fallback
      const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'security') {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only security staff can verify QR codes"
        );
      }
    }
    
    // Decode the QR data (simple base64 decode)
    let qrData;
    try {
      const jsonString = Buffer.from(encodedData, 'base64').toString();
      qrData = JSON.parse(jsonString);
    } catch (error) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid QR code format"
      );
    }
    
    // Validate the decoded data has required fields
    if (!qrData.userId || !qrData.eventId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "QR code missing required data"
      );
    }
    
    // Verify event ID matches
    if (qrData.eventId !== eventId) {
      return {
        valid: false,
        reason: "QR code is for a different event"
      };
    }
    
    // Get the event data
    const eventRef = admin.firestore().collection("events").doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return {
        valid: false,
        reason: "Event not found"
      };
    }
    
    const eventData = eventDoc.data();
    
    // Verify user is in attendees list
    if (!eventData.attendees || !eventData.attendees.includes(qrData.userId)) {
      return {
        valid: false,
        reason: "User is not registered for this event"
      };
    }
    
    // Get user data for display
    const userDoc = await admin.firestore().collection("users").doc(qrData.userId).get();
    
    if (!userDoc.exists) {
      return {
        valid: false,
        reason: "User not found"
      };
    }
    
    const userData = userDoc.data();
    
    // Record check-in
    const checkInRef = admin.firestore().collection("eventCheckIns").doc(eventId).collection("records").doc();
    await checkInRef.set({
      userId: qrData.userId,
      securityId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      displayName: userData.displayName || "Unknown User",
      photoURL: userData.photoURL || ""
    });
    
    // Update security staff scan count
    await securityStaffRef.update({
      scanCount: admin.firestore.FieldValue.increment(1),
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return success with user details
    return {
      valid: true,
      userData: {
        displayName: userData.displayName || "Unknown User",
        photoURL: userData.photoURL || "",
        email: userData.email || "",
        userId: qrData.userId
      },
      message: "Attendance verified successfully"
    };
  } catch (error) {
    console.error("Error verifying QR code:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while verifying the QR code",
      error
    );
  }
});

/**
 * Registers a user for an event securely with proper permission checks
 */
exports.registerUserForEvent = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to register for events."
    );
  }

  const { eventId } = data;
  const userId = context.auth.uid;

  // Input validation
  if (!eventId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with an eventId."
    );
  }

  try {
    // Get the event document
    const eventRef = admin.firestore().collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "The specified event does not exist."
      );
    }

    const eventData = eventDoc.data();

    // If the event doesn't require approval, we can register the user immediately
    if (!eventData.requiresApproval) {
      // Add user to attendees if not already registered
      if (!eventData.attendees || !eventData.attendees.includes(userId)) {
        await eventRef.update({
          attendees: admin.firestore.FieldValue.arrayUnion(userId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, message: "Successfully registered for event" };
      } else {
        return { success: true, message: "Already registered for this event" };
      }
    }

    // Check if the user is directly pre-approved
    if (eventData.preApprovedUsers && eventData.preApprovedUsers.includes(userId)) {
      await eventRef.update({
        attendees: admin.firestore.FieldValue.arrayUnion(userId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: "Successfully registered as pre-approved user" };
    }

    // Check if the user is in a pre-approved group
    if (eventData.preApprovedGroups && eventData.preApprovedGroups.length > 0) {
      // Get the user document to check their groups
      const userRef = admin.firestore().collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User document not found."
        );
      }

      const userData = userDoc.data();

      // First try a direct check with the user's groups
      if (userData.groups && userData.groups.length > 0) {
        // Check if any of the user's groups are in the event's pre-approved groups
        const isInPreApprovedGroup = userData.groups.some(groupId => 
          eventData.preApprovedGroups.includes(groupId)
        );

        if (isInPreApprovedGroup) {
          await eventRef.update({
            attendees: admin.firestore.FieldValue.arrayUnion(userId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          return { success: true, message: "Successfully registered as member of pre-approved group" };
        }
      }

      // Double-check by querying groups collection
      const groupsQuery = await admin.firestore()
        .collection("groups")
        .where("members", "array-contains", userId)
        .get();

      if (!groupsQuery.empty) {
        // Get all group IDs where user is a member
        const userGroupIds = groupsQuery.docs.map(doc => doc.id);
        
        // Update user document with correct group memberships
        if (userData.groups?.sort().toString() !== userGroupIds.sort().toString()) {
          await userRef.update({
            groups: userGroupIds,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Check if any groups match the pre-approved groups
        const matchingGroups = userGroupIds.filter(groupId => 
          eventData.preApprovedGroups.includes(groupId)
        );

        if (matchingGroups.length > 0) {
          await eventRef.update({
            attendees: admin.firestore.FieldValue.arrayUnion(userId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          return { 
            success: true, 
            message: "Successfully registered as member of pre-approved group",
            groups: matchingGroups
          };
        }
      }
    }

    // Check if the user has an approved request
    const approvalRequestQuery = await admin.firestore()
      .collection("approvalRequests")
      .where("eventId", "==", eventId)
      .where("userId", "==", userId)
      .where("status", "==", "approved")
      .get();

    if (!approvalRequestQuery.empty) {
      await eventRef.update({
        attendees: admin.firestore.FieldValue.arrayUnion(userId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: "Successfully registered with approved request" };
    }

    // If we get here, the user is not approved to register
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to register for this event. Please request approval first."
    );
  } catch (error) {
    console.error("Error registering user for event:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while processing your registration.",
      error
    );
  }
});
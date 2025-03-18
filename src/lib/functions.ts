import { getFunctions, httpsCallable } from "firebase/functions";

// Initialize Firebase Functions
const functions = getFunctions();

/**
 * Registers a user for an event using the Cloud Function
 * This bypasses client-side permissions by using admin privileges on the server
 */
export const registerForEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const registerUserForEvent = httpsCallable(functions, 'registerUserForEvent');
    const result = await registerUserForEvent({ eventId });
    
    // The result is wrapped in a data property
    return result.data as { success: boolean; message: string };
  } catch (error: any) {
    console.error("Error registering for event:", error);
    
    // Extract the error message from the Firebase Functions error
    if (error.code === 'functions/permission-denied') {
      throw new Error("You don't have permission to register for this event. Please request approval first.");
    } else if (error.code === 'functions/not-found') {
      throw new Error("Event or user data not found.");
    } else if (error.details?.message) {
      throw new Error(error.details.message);
    } else {
      throw new Error("Failed to register for event. Please try again later.");
    }
  }
};
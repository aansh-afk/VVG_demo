"use client";

import { getDocument } from '../firestore';
import { QRCodeData, decryptQRData } from '../qr-utils';

// Verify QR code and validate against event attendance
export const verifyQRCode = async (encodedData: string, eventId: string): Promise<{
  valid: boolean;
  data?: QRCodeData;
  reason?: string;
}> => {
  try {
    // Decode the QR code data (no decryption needed)
    const data = await decryptQRData(encodedData);
    
    // Verify that the QR code is for the specified event
    if (data.eventId !== eventId) {
      return {
        valid: false,
        reason: "QR code is for a different event"
      };
    }
    
    // Verify the user is registered for the event by checking Firebase
    try {
      const event = await getDocument('events', data.eventId);
      
      if (!event) {
        return {
          valid: false,
          reason: "Event not found"
        };
      }
      
      // Check if the user is in the attendees array
      if (!event.attendees || !event.attendees.includes(data.userId)) {
        return {
          valid: false,
          reason: "User is not registered for this event"
        };
      }
      
      // QR code is valid for this event and user is registered
      return {
        valid: true,
        data
      };
    } catch (error) {
      console.error("Error verifying attendance:", error);
      return {
        valid: false,
        reason: "Error verifying attendance"
      };
    }
  } catch (error) {
    return {
      valid: false,
      reason: "Invalid QR code format"
    };
  }
};
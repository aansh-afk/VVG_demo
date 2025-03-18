"use client";

// Simplified QR code data structure
export interface QRCodeData {
  userId: string;
  eventId: string;
}

// Simple encoding of QR data using JSON and base64
export const encryptQRData = async (data: QRCodeData): Promise<string> => {
  try {
    // Convert data to JSON
    const jsonString = JSON.stringify(data);
    
    // Use simple base64 encoding
    return btoa(jsonString);
  } catch (error) {
    console.error("Error creating QR data:", error);
    throw error;
  }
};

// Decrypt the QR code data
export const decryptQRData = async (encodedData: string): Promise<QRCodeData> => {
  try {
    // Decode base64
    const jsonString = atob(encodedData);
    
    // Parse the JSON data
    return JSON.parse(jsonString) as QRCodeData;
  } catch (error) {
    console.error("Error decoding QR data:", error);
    throw error;
  }
};

// Generate QR code data for an event
export const generateQRCodeData = (
  userId: string,
  eventId: string
): QRCodeData => {
  return {
    userId,
    eventId
  };
};
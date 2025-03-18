/**
 * QR Code Data Extraction Script for Indian Embassy Security
 * 
 * This script extracts the raw data from a QR code without attempting decryption
 */

const fs = require('fs');

// Function to extract QR code data
function extractQRData(encodedData) {
  try {
    // Clean up the QR data string - remove spaces, line breaks, etc.
    encodedData = encodedData.replace(/\s+/g, '');
    
    // Parse the Base64 encoded JSON
    try {
      const data = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));
      return {
        success: true,
        structure: {
          hasIV: !!data.iv,
          hasKey: !!data.key,
          hasData: !!data.data,
          iv: data.iv ? data.iv.substring(0, 20) + '...' : 'none',
          keyLength: data.key ? data.key.length : 0,
          dataLength: data.data ? data.data.length : 0
        },
        rawData: data
      };
    } catch (parseError) {
      return {
        success: false,
        error: parseError.message,
        rawInput: encodedData.substring(0, 100) + '...'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Main function
function main() {
  // Check if QR code data was provided
  const qrData = process.argv[2];
  
  if (!qrData) {
    console.log('Usage: node extract-qr.js <base64-encoded-qr-data>');
    console.log('\nThis script extracts and analyzes QR data structure without decryption');
    
    // Try with a sample if available
    const sampleQRData = 'eyJpdiI6Im5HUHdiQzB5ZjZjdlJ5V0JyL05sS0E9PSIsImtleSI6IkV4Qy9RajR6ckZXQ2VkcHYwQW1Ic0lndjQwNjRsYS9GNFNPM012SnhWbDYwbkptOHlCQzU1UWkrcUpTcEkxVGpETGlRdGdmSlY3amhYVjBjYnBFcUs3aUhtUE1CVU0zOHh5dGFTNnpRUFBoNXNGdFNVRlF2NEdFMUphWTJ0Q2tQdHp0akJqZ0h4UXNaeFdoWDZpS0t6Z2FRNHRUOUp2bzBMK2hyeHp2TEo2MEhzZUdEU1NBRXRoQzdDbU1UbkJhdTNQVjkyTk1mUHJXZldzZXNVaFBCOUdXVGtIenpualMwZUhXaUpTSHBkQWU5a1lYVjF1d0ZpTldPdHhYNVFhKzV6M2tSbHVIMEc3R1lFUm9KTmFjZi9NNDBHWEJtbWNHZXZNcEp3bkttc0RSaitHdUt1UzJjWjhDbk8zVkVyaXNRb3ZzOWptd3ViK3lKMyt6T0xJY2xrUT09IiwiZGF0YSI6InB4TTZqM2dzcnp3dVZTUGxRcEZqb2xoWitxdFE1d0d0MVZYcnF4VFZLcVRwa1U2YTBzT0lrUStJWFQwYWpJd08vdDFQbkhlSWwxYTkzNmg0d2s2Z2JhZFE5b1N4OWJzOTBJZExLSFBKVlcvQUR6N0c2RjdKc2h3c2xsMEwzRFVhZWtJNHN4eTg1bC9wSHRPenkvNTU4eDU0NEQ2b1crdjJwb3dVQWpWbnA5Y2lqV05YNXB6c0dteW9ScUZSY0wvVi8yUnl5L1Q0NkpZd1VWazc5MWxRTlZNcmdtYWNvQWNtRW1ieSsyVG8rRDM5TGI3RDNFQKM1M2d5aUxyQlRJSFJIN2E4QUJjbXZ0WXJ3RnphK2xaREQyYlR3WFpwWVUyS3pzWXN3SmFVaytiUHVZS1FpMCtKMGFEVHNRQjhVb1NjQ1JYK3RJYis1NHBZRmVWcFdkVkxZWFZ2YmVWK2UrajJXR21EWk9pSGJYQzdNL0w0Q2piTnlSdVV5VkRuUVhGWEYrMVpuMUE4Z0w1YytEUmM5OXIxRkxTdStVQTFPRTZkSjY5QUFTYU9jPSJ9'
    
    if (sampleQRData) {
      console.log('\nAnalyzing sample QR data...');
      const result = extractQRData(sampleQRData);
      console.log('\nAnalysis result:');
      console.log(JSON.stringify(result, null, 2));
    }
    
    return;
  }
  
  // Extract the provided QR code
  const result = extractQRData(qrData);
  
  // Output the result
  console.log(JSON.stringify(result, null, 2));
}

// Entry point
main();
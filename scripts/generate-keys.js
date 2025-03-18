/**
 * Generate Encryption Keys Script
 * 
 * This script generates:
 * 1. An RSA key pair for secure QR code encryption/decryption
 * 2. A fixed AES key for symmetric encryption
 * 
 * Usage:
 * node scripts/generate-keys.js
 * 
 * How it works:
 * 1. Generates a 2048-bit RSA key pair
 * 2. Generates a fixed 256-bit AES key
 * 3. Exports keys in formats needed by the application
 * 4. Saves the keys to JSON files
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

// Configuration
const RSA_KEY_SIZE = 2048;
const AES_KEY_SIZE = 32; // 256-bits
const KEYS_DIR = path.join(__dirname, '../src/lib/keys');
const RSA_PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public_key.json');
const RSA_PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private_key.json');
const AES_KEY_PATH = path.join(KEYS_DIR, 'aes_key.json');

// Ensure keys directory exists
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

// Generate RSA key pair
console.log(`Generating ${RSA_KEY_SIZE}-bit RSA key pair...`);
const rsaKeyPair = forge.pki.rsa.generateKeyPair({ bits: RSA_KEY_SIZE, e: 0x10001 });

// Export RSA keys to PEM format
const publicKeyPem = forge.pki.publicKeyToPem(rsaKeyPair.publicKey);
const privateKeyPem = forge.pki.privateKeyToPem(rsaKeyPair.privateKey);

// Extract base64 portion of the PEM keys
const publicKeyBase64 = publicKeyPem
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\r?\n/g, '');

const privateKeyBase64 = privateKeyPem
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\r?\n/g, '');

// Generate a fixed AES key (not random, so it's consistent across app usage)
console.log(`Generating ${AES_KEY_SIZE * 8}-bit AES key...`);
const aesKey = forge.util.bytesToHex(forge.random.getBytesSync(AES_KEY_SIZE));

// Create JSON objects for the keys
const publicKeyJson = {
  publicKey: publicKeyBase64,
  format: 'spki',
  algorithm: 'RSA-OAEP-256',
  keySize: RSA_KEY_SIZE
};

const privateKeyJson = {
  privateKey: privateKeyBase64,
  format: 'pkcs8',
  algorithm: 'RSA-OAEP-256',
  keySize: RSA_KEY_SIZE
};

const aesKeyJson = {
  key: aesKey,
  algorithm: 'AES-CBC',
  keySize: AES_KEY_SIZE * 8
};

// Write keys to files
fs.writeFileSync(RSA_PUBLIC_KEY_PATH, JSON.stringify(publicKeyJson, null, 2));
fs.writeFileSync(RSA_PRIVATE_KEY_PATH, JSON.stringify(privateKeyJson, null, 2));
fs.writeFileSync(AES_KEY_PATH, JSON.stringify(aesKeyJson, null, 2));

console.log('Keys generated successfully!');
console.log(`Public RSA key saved to: ${RSA_PUBLIC_KEY_PATH}`);
console.log(`Private RSA key saved to: ${RSA_PRIVATE_KEY_PATH}`);
console.log(`AES key saved to: ${AES_KEY_PATH}`);
console.log('\nIMPORTANT SECURITY NOTES:');
console.log('- Keep the private key and AES key secure and restrict access to them');
console.log('- In a production environment, store these keys in a secure key vault');
console.log('- Only the public key should be included in the client-side application');
console.log('- The private key and AES key should only be accessible to the security staff application');
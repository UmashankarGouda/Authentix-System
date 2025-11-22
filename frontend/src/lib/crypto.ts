// @ts-ignore - shamirs-secret-sharing doesn't have type definitions
import * as sss from 'shamirs-secret-sharing';
import { Buffer } from 'buffer';

// ==================== AES-256-GCM Encryption ====================

/**
 * Generate a random AES-256 key
 */
export async function generateAESKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random 12-byte IV for AES-GCM
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Encrypt data with AES-256-GCM
 * @returns { ciphertext, authTag, iv }
 */
export async function encryptAESGCM(
  data: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<{ ciphertext: ArrayBuffer; authTag: ArrayBuffer }> {
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv.buffer.slice(0)) as Uint8Array & { buffer: ArrayBuffer },
      tagLength: 128, // 16 bytes
    },
    key,
    data
  ) as ArrayBuffer;

  // In AES-GCM, the last 16 bytes are the auth tag
  const authTag = encrypted.slice(-16);
  const ciphertext = encrypted.slice(0, -16);

  return { ciphertext, authTag };
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decryptAESGCM(
  ciphertext: ArrayBuffer,
  authTag: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  // Combine ciphertext and authTag
  const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
  combined.set(new Uint8Array(ciphertext), 0);
  combined.set(new Uint8Array(authTag), ciphertext.byteLength);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv.buffer.slice(0)) as Uint8Array & { buffer: ArrayBuffer },
      tagLength: 128,
    },
    key,
    combined
  ) as ArrayBuffer;

  return decrypted;
}

/**
 * Export AES key as raw bytes
 */
export async function exportAESKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', key);
}

/**
 * Import AES key from raw bytes
 */
export async function importAESKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// ==================== SHA-256 Hashing ====================

/**
 * Compute SHA-256 hash of data
 * @returns hex string
 */
export async function sha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Compute SHA-256 hash and return as bytes32 (0x-prefixed hex)
 */
export async function sha256Bytes32(data: ArrayBuffer): Promise<string> {
  const hash = await sha256(data);
  return '0x' + hash;
}

// ==================== Shamir Secret Sharing ====================

/**
 * Split a secret (AES key) into shares using Shamir's Secret Sharing
 * @param secret - The secret as hex string
 * @param numShares - Total number of shares (n)
 * @param threshold - Minimum shares needed to reconstruct (k)
 * @returns Array of hex-encoded shares
 */
export function splitSecret(
  secret: string,
  numShares: number,
  threshold: number
): string[] {
  // Remove 0x prefix if present
  const secretHex = secret.startsWith('0x') ? secret.slice(2) : secret;
  
  // Convert hex string to Buffer (required by shamirs-secret-sharing)
  const secretBuffer = Buffer.from(secretHex, 'hex');
  
  // Split the secret using shamirs-secret-sharing
  const shares = sss.split(secretBuffer, { shares: numShares, threshold: threshold });
  
  // Convert Buffer shares to hex strings
  return shares.map((share: Buffer) => share.toString('hex'));
}

/**
 * Combine shares to reconstruct the original secret
 * @param shares - Array of hex-encoded shares (at least k shares)
 * @returns Reconstructed secret as hex string
 */
export function combineShares(shares: string[]): string {
  // Convert hex strings to Buffers (required by shamirs-secret-sharing)
  const shareBuffers = shares.map(share => Buffer.from(share, 'hex'));
  
  // Combine the shares
  const secret = sss.combine(shareBuffers);
  
  // Return as hex string
  return secret.toString('hex');
}

// ==================== RSA Encryption ====================

/**
 * Import RSA public key from PEM string
 */
export async function importRSAPublicKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM header/footer and whitespace
  const pemContents = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');

  const binaryDer = base64ToArrayBuffer(pemContents);

  return await crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Encrypt data with RSA-OAEP
 * @returns base64-encoded ciphertext
 */
export async function encryptRSA(
  data: ArrayBuffer,
  publicKey: CryptoKey
): Promise<string> {
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    data
  );

  return arrayBufferToBase64(encrypted);
}

/**
 * Generate RSA keypair for recovery
 */
export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export RSA public key as PEM
 */
export async function exportRSAPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key);
  const base64 = arrayBufferToBase64(exported);
  return `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC KEY-----`;
}

/**
 * Import RSA private key from raw format
 */
export async function importRSAPrivateKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

/**
 * Decrypt data with RSA-OAEP
 */
export async function decryptRSA(
  ciphertextBase64: string,
  privateKey: CryptoKey
): Promise<ArrayBuffer> {
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  return await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    ciphertext
  );
}

// ==================== Helper Functions ====================

/**
 * Convert ArrayBuffer to hex string
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert Uint8Array to hex string
 */
export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert hex string to ArrayBuffer
 */
export function hexToBuffer(hex: string): ArrayBuffer {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Read File as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Create canonical JSON string for hashing
 */
export function canonicalJSON(obj: object): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * Compute hash of canonical JSON
 */
export async function hashCanonicalJSON(obj: object): Promise<string> {
  const jsonString = canonicalJSON(obj);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  return await sha256Bytes32(data.buffer);
}

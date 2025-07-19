import { CryptoService, EncryptedData, KeyDerivationParams } from '../types';
import { createCryptoError, sanitizeErrorMessage } from '../errors';

export class WebCryptoService implements CryptoService {
  private static readonly CIPHER_ALGORITHM = 'AES-GCM';
  private static readonly DEFAULT_IV_LENGTH = 12;
  private static readonly DEFAULT_SALT_LENGTH = 32;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly TAG_LENGTH_BITS = 128;

  async deriveKey(
    password: string, 
    salt: Uint8Array, 
    params: KeyDerivationParams
  ): Promise<Uint8Array> {
    try {
      if (!password || password.length === 0) {
        throw createCryptoError('validation', 'EMPTY_PASSWORD', 'Password cannot be empty');
      }

      if (salt.length === 0) {
        throw createCryptoError('validation', 'EMPTY_SALT', 'Salt cannot be empty');
      }

      // Import password as key material
      const passwordBuffer = new TextEncoder().encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      // Clear password buffer for security
      passwordBuffer.fill(0);

      // Derive key using PBKDF2
      const hashAlgorithm = params.hashFunction === 'sha512' ? 'SHA-512' : 'SHA-256';
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: params.iterations,
          hash: hashAlgorithm
        },
        keyMaterial,
        params.keyLength * 8 // Convert bytes to bits
      );

      return new Uint8Array(derivedBits);
    } catch (error) {
      if (error instanceof Error && error.name === 'CryptoError') {
        throw error;
      }
      
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw createCryptoError('key_derivation', 'DERIVATION_FAILED', sanitizedMessage);
    }
  }

  async encrypt(data: Uint8Array, key: Uint8Array): Promise<EncryptedData> {
    try {
      if (data.length === 0) {
        throw createCryptoError('validation', 'EMPTY_DATA', 'Data cannot be empty');
      }

      if (key.length !== 32) {
        throw createCryptoError('validation', 'INVALID_KEY_LENGTH', 'Key must be 32 bytes for AES-256');
      }

      const iv = this.generateIV();
      const salt = this.generateSalt();

      // Import key for WebCrypto
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: WebCryptoService.CIPHER_ALGORITHM, length: 256 },
        false,
        ['encrypt']
      );

      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: WebCryptoService.CIPHER_ALGORITHM,
          iv: iv,
          tagLength: WebCryptoService.TAG_LENGTH_BITS
        },
        cryptoKey,
        data
      );

      // WebCrypto returns encrypted data + auth tag combined
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedData = encryptedArray.slice(0, -WebCryptoService.AUTH_TAG_LENGTH);
      const authTag = encryptedArray.slice(-WebCryptoService.AUTH_TAG_LENGTH);

      return {
        data: encryptedData,
        iv: iv,
        salt: salt,
        authTag: authTag
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'CryptoError') {
        throw error;
      }
      
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw createCryptoError('encryption', 'ENCRYPTION_FAILED', sanitizedMessage);
    }
  }

  async decrypt(encryptedData: EncryptedData, key: Uint8Array): Promise<Uint8Array | null> {
    try {
      if (key.length !== 32) {
        throw createCryptoError('validation', 'INVALID_KEY_LENGTH', 'Key must be 32 bytes for AES-256');
      }

      if (encryptedData.data.length === 0) {
        throw createCryptoError('validation', 'EMPTY_ENCRYPTED_DATA', 'Encrypted data cannot be empty');
      }

      if (encryptedData.iv.length !== WebCryptoService.DEFAULT_IV_LENGTH) {
        throw createCryptoError('validation', 'INVALID_IV_LENGTH', 'IV must be 12 bytes for AES-256-GCM');
      }

      if (encryptedData.authTag.length !== WebCryptoService.AUTH_TAG_LENGTH) {
        throw createCryptoError('validation', 'INVALID_AUTH_TAG_LENGTH', 'Auth tag must be 16 bytes for AES-256-GCM');
      }

      // Import key for WebCrypto
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: WebCryptoService.CIPHER_ALGORITHM, length: 256 },
        false,
        ['decrypt']
      );

      // Combine encrypted data and auth tag for WebCrypto
      const combinedData = new Uint8Array(encryptedData.data.length + encryptedData.authTag.length);
      combinedData.set(encryptedData.data);
      combinedData.set(encryptedData.authTag, encryptedData.data.length);

      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: WebCryptoService.CIPHER_ALGORITHM,
          iv: encryptedData.iv,
          tagLength: WebCryptoService.TAG_LENGTH_BITS
        },
        cryptoKey,
        combinedData
      );

      return new Uint8Array(decryptedBuffer);
    } catch (error) {
      if (error instanceof Error && error.name === 'CryptoError') {
        throw error;
      }

      // Return null for authentication failures to prevent timing attacks
      // and maintain consistent behavior with Node.js implementation
      return null;
    }
  }

  generateSalt(length: number = WebCryptoService.DEFAULT_SALT_LENGTH): Uint8Array {
    try {
      const salt = new Uint8Array(length);
      crypto.getRandomValues(salt);
      return salt;
    } catch (error) {
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw createCryptoError('initialization', 'SALT_GENERATION_FAILED', sanitizedMessage);
    }
  }

  generateIV(length: number = WebCryptoService.DEFAULT_IV_LENGTH): Uint8Array {
    try {
      const iv = new Uint8Array(length);
      crypto.getRandomValues(iv);
      return iv;
    } catch (error) {
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw createCryptoError('initialization', 'IV_GENERATION_FAILED', sanitizedMessage);
    }
  }
}
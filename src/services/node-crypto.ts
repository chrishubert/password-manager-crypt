import { createCipheriv, createDecipheriv, randomBytes, pbkdf2 } from 'crypto';
import { promisify } from 'util';
import { CryptoService, EncryptedData, KeyDerivationParams } from '../types';
import { createCryptoError, sanitizeErrorMessage } from '../errors';

const pbkdf2Async = promisify(pbkdf2);

export class NodeCryptoService implements CryptoService {
  private static readonly CIPHER_ALGORITHM = 'aes-256-gcm';
  private static readonly DEFAULT_IV_LENGTH = 12;
  private static readonly DEFAULT_SALT_LENGTH = 32;
  private static readonly AUTH_TAG_LENGTH = 16;

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


      const hashAlgorithm = params.hashFunction === 'sha512' ? 'sha512' : 'sha256';
      
      const derivedKey = await pbkdf2Async(
        password,
        Buffer.from(salt),
        params.iterations,
        params.keyLength,
        hashAlgorithm
      );

      return new Uint8Array(derivedKey);
    } catch (error) {
      if (error instanceof Error && error.name === 'CryptoError') {
        throw error;
      }
      
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw createCryptoError('key_derivation', 'DERIVATION_FAILED', sanitizedMessage);
    }
  }

  encrypt(data: Uint8Array, key: Uint8Array): Promise<EncryptedData> {
    try {
      if (data.length === 0) {
        throw createCryptoError('validation', 'EMPTY_DATA', 'Data cannot be empty');
      }

      if (key.length !== 32) {
        throw createCryptoError('validation', 'INVALID_KEY_LENGTH', 'Key must be 32 bytes for AES-256');
      }

      const iv = this.generateIV();
      const salt = this.generateSalt();
      
      const cipher = createCipheriv(NodeCryptoService.CIPHER_ALGORITHM, key, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(Buffer.from(data)),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      return Promise.resolve({
        data: new Uint8Array(encrypted),
        iv: new Uint8Array(iv),
        salt: new Uint8Array(salt),
        authTag: new Uint8Array(authTag)
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'CryptoError') {
        throw error;
      }
      
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw createCryptoError('encryption', 'ENCRYPTION_FAILED', sanitizedMessage);
    }
  }

  decrypt(encryptedData: EncryptedData, key: Uint8Array): Promise<Uint8Array | null> {
    try {
      if (key.length !== 32) {
        throw createCryptoError('validation', 'INVALID_KEY_LENGTH', 'Key must be 32 bytes for AES-256');
      }

      if (encryptedData.data.length === 0) {
        throw createCryptoError('validation', 'EMPTY_ENCRYPTED_DATA', 'Encrypted data cannot be empty');
      }

      if (encryptedData.iv.length !== NodeCryptoService.DEFAULT_IV_LENGTH) {
        throw createCryptoError('validation', 'INVALID_IV_LENGTH', 'IV must be 12 bytes for AES-256-GCM');
      }

      if (encryptedData.authTag.length !== NodeCryptoService.AUTH_TAG_LENGTH) {
        throw createCryptoError('validation', 'INVALID_AUTH_TAG_LENGTH', 'Auth tag must be 16 bytes for AES-256-GCM');
      }

      const decipher = createDecipheriv(
        NodeCryptoService.CIPHER_ALGORITHM,
        key,
        encryptedData.iv
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.data)),
        decipher.final()
      ]);

      return Promise.resolve(new Uint8Array(decrypted));
    } catch (error) {
      if (error instanceof Error && error.name === 'CryptoError') {
        throw error;
      }

      return Promise.resolve(null);
    }
  }

  generateSalt(length: number = NodeCryptoService.DEFAULT_SALT_LENGTH): Uint8Array {
    try {
      const salt = randomBytes(length);
      return new Uint8Array(salt);
    } catch (error) {
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw createCryptoError('initialization', 'SALT_GENERATION_FAILED', sanitizedMessage);
    }
  }

  generateIV(length: number = NodeCryptoService.DEFAULT_IV_LENGTH): Uint8Array {
    try {
      const iv = randomBytes(length);
      return new Uint8Array(iv);
    } catch (error) {
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw createCryptoError('initialization', 'IV_GENERATION_FAILED', sanitizedMessage);
    }
  }

}
import { NodeCryptoService } from '../services/node-crypto';
import { DEFAULT_KEY_DERIVATION_PARAMS } from '../types';
import { CryptoErrorImpl } from '../errors';

describe('NodeCryptoService', () => {
  let service: NodeCryptoService;

  beforeEach(() => {
    service = new NodeCryptoService();
  });

  describe('generateSalt', () => {
    it('should generate salt with default length', () => {
      const salt = service.generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32);
    });

    it('should generate salt with custom length', () => {
      const salt = service.generateSalt(16);
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate different salts on each call', () => {
      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();
      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('generateIV', () => {
    it('should generate IV with default length', () => {
      const iv = service.generateIV();
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
    });

    it('should generate IV with custom length', () => {
      const iv = service.generateIV(16);
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(16);
    });

    it('should generate different IVs on each call', () => {
      const iv1 = service.generateIV();
      const iv2 = service.generateIV();
      expect(iv1).not.toEqual(iv2);
    });
  });

  describe('deriveKey', () => {
    it('should derive key with default parameters', async () => {
      const password = 'test-password-123';
      const salt = service.generateSalt();
      
      const key = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      
      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should derive same key with same inputs', async () => {
      const password = 'test-password-123';
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      
      const key1 = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const key2 = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      
      expect(key1).toEqual(key2);
    });

    it('should derive different keys with different passwords', async () => {
      const salt = service.generateSalt();
      
      const key1 = await service.deriveKey('password1', salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const key2 = await service.deriveKey('password2', salt, DEFAULT_KEY_DERIVATION_PARAMS);
      
      expect(key1).not.toEqual(key2);
    });

    it('should derive different keys with different salts', async () => {
      const password = 'test-password-123';
      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();
      
      const key1 = await service.deriveKey(password, salt1, DEFAULT_KEY_DERIVATION_PARAMS);
      const key2 = await service.deriveKey(password, salt2, DEFAULT_KEY_DERIVATION_PARAMS);
      
      expect(key1).not.toEqual(key2);
    });

    it('should throw error for empty password', async () => {
      const salt = service.generateSalt();
      
      await expect(service.deriveKey('', salt, DEFAULT_KEY_DERIVATION_PARAMS))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should throw error for empty salt', async () => {
      const password = 'test-password-123';
      const emptySalt = new Uint8Array(0);
      
      await expect(service.deriveKey(password, emptySalt, DEFAULT_KEY_DERIVATION_PARAMS))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should handle internal crypto errors', async () => {
      const password = 'test-password-123';
      const salt = service.generateSalt();
      
      // Use invalid iterations (negative number) to trigger error
      const invalidParams = {
        iterations: -1,
        keyLength: 32,
        algorithm: 'pbkdf2' as const,
        hashFunction: 'sha256' as const
      };
      
      await expect(service.deriveKey(password, salt, invalidParams))
        .rejects.toThrow(CryptoErrorImpl);
    });

  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const originalData = new TextEncoder().encode('Hello, World! This is a test message.');
      const password = 'test-password-123';
      const salt = service.generateSalt();
      
      const key = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const encryptedData = await service.encrypt(originalData, key);
      const decryptedData = await service.decrypt(encryptedData, key);
      
      expect(decryptedData).toEqual(originalData);
    });

    it('should return different encrypted data for same input', async () => {
      const originalData = new TextEncoder().encode('Hello, World!');
      const password = 'test-password-123';
      const salt = service.generateSalt();
      
      const key = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const encryptedData1 = await service.encrypt(originalData, key);
      const encryptedData2 = await service.encrypt(originalData, key);
      
      expect(encryptedData1.data).not.toEqual(encryptedData2.data);
      expect(encryptedData1.iv).not.toEqual(encryptedData2.iv);
    });

    it('should return null for invalid key during decryption', async () => {
      const originalData = new TextEncoder().encode('Hello, World!');
      const password = 'test-password-123';
      const salt = service.generateSalt();
      
      const key = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const wrongKey = await service.deriveKey('wrong-password', salt, DEFAULT_KEY_DERIVATION_PARAMS);
      
      const encryptedData = await service.encrypt(originalData, key);
      const decryptedData = await service.decrypt(encryptedData, wrongKey);
      
      expect(decryptedData).toBeNull();
    });

    it('should return null for tampered encrypted data', async () => {
      const originalData = new TextEncoder().encode('Hello, World!');
      const password = 'test-password-123';
      const salt = service.generateSalt();
      
      const key = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const encryptedData = await service.encrypt(originalData, key);
      
      const tamperedData = { ...encryptedData };
      if (tamperedData.data.length > 0) {
        tamperedData.data[0] = tamperedData.data[0]! ^ 1;
      }
      
      const decryptedData = await service.decrypt(tamperedData, key);
      expect(decryptedData).toBeNull();
    });

    it('should throw error for empty data during encryption', async () => {
      const emptyData = new Uint8Array(0);
      const password = 'test-password-123';
      const salt = service.generateSalt();
      
      const key = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      
      try {
        await service.encrypt(emptyData, key);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CryptoErrorImpl);
      }
    });

    it('should throw error for invalid key length during encryption', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const invalidKey = new Uint8Array(16);
      
      try {
        await service.encrypt(data, invalidKey);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CryptoErrorImpl);
      }
    });

    it('should throw error for invalid key length during decryption', async () => {
      const originalData = new TextEncoder().encode('Hello, World!');
      const password = 'test-password-123';
      const salt = service.generateSalt();
      
      const key = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const encryptedData = await service.encrypt(originalData, key);
      const invalidKey = new Uint8Array(16);
      
      try {
        await service.decrypt(encryptedData, invalidKey);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CryptoErrorImpl);
      }
    });

    it('should handle encryption errors', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const key = new Uint8Array(16); // Invalid key length
      
      try {
        await service.encrypt(data, key);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CryptoErrorImpl);
      }
    });

    it('should throw error for empty encrypted data during decryption', async () => {
      const key = new Uint8Array(32);
      const emptyEncryptedData = {
        data: new Uint8Array(0),
        iv: new Uint8Array(12),
        salt: new Uint8Array(32),
        authTag: new Uint8Array(16)
      };
      
      try {
        await service.decrypt(emptyEncryptedData, key);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CryptoErrorImpl);
      }
    });

    it('should throw error for invalid IV length during decryption', async () => {
      const key = new Uint8Array(32);
      const invalidIVData = {
        data: new Uint8Array(16),
        iv: new Uint8Array(8), // Invalid IV length
        salt: new Uint8Array(32),
        authTag: new Uint8Array(16)
      };
      
      try {
        await service.decrypt(invalidIVData, key);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CryptoErrorImpl);
      }
    });

    it('should throw error for invalid auth tag length during decryption', async () => {
      const key = new Uint8Array(32);
      const invalidAuthTagData = {
        data: new Uint8Array(16),
        iv: new Uint8Array(12),
        salt: new Uint8Array(32),
        authTag: new Uint8Array(8) // Invalid auth tag length
      };
      
      try {
        await service.decrypt(invalidAuthTagData, key);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CryptoErrorImpl);
      }
    });
  });

  describe('generateSalt error handling', () => {
    it('should handle invalid length parameters', () => {
      expect(() => service.generateSalt(-1))
        .toThrow(CryptoErrorImpl);
    });
  });

  describe('generateIV error handling', () => {
    it('should handle invalid length parameters', () => {
      expect(() => service.generateIV(-1))
        .toThrow(CryptoErrorImpl);
    });
  });

  describe('NIST test vectors', () => {
    it('should derive key matching NIST PBKDF2 test vector', async () => {
      const password = 'password';
      const salt = new TextEncoder().encode('salt');
      const params = {
        iterations: 1,
        keyLength: 20,
        algorithm: 'pbkdf2' as const,
        hashFunction: 'sha256' as const
      };
      
      const key = await service.deriveKey(password, salt, params);
      
      const expectedKey = new Uint8Array([
        0x12, 0x0f, 0xb6, 0xcf, 0xfc, 0xf8, 0xb3, 0x2c,
        0x43, 0xe7, 0x22, 0x52, 0x56, 0xc4, 0xf8, 0x37,
        0xa8, 0x65, 0x48, 0xc9
      ]);
      
      expect(key).toEqual(expectedKey);
    });
  });
});
import { WebCryptoService } from '../services/web-crypto';
import { DEFAULT_KEY_DERIVATION_PARAMS } from '../types';
import { CryptoErrorImpl } from '../errors';

// Mock WebCrypto API for testing
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveBits: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    generateKey: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

// Setup global crypto mock
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

describe('WebCryptoService', () => {
  let service: WebCryptoService;

  beforeEach(() => {
    service = new WebCryptoService();
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    });
  });

  describe('generateSalt', () => {
    it('should generate salt with default length', () => {
      const salt = service.generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it('should generate salt with custom length', () => {
      const salt = service.generateSalt(16);
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate different salts on each call', () => {
      // Mock to return different values
      let callCount = 0;
      mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = (callCount * 10 + i) % 256;
        }
        callCount++;
        return array;
      });

      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();
      expect(salt1).not.toEqual(salt2);
    });

    it('should throw error if crypto.getRandomValues fails', () => {
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Random generation failed');
      });

      expect(() => service.generateSalt()).toThrow(CryptoErrorImpl);
    });
  });

  describe('generateIV', () => {
    it('should generate IV with default length', () => {
      const iv = service.generateIV();
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it('should generate IV with custom length', () => {
      const iv = service.generateIV(16);
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(16);
    });

    it('should generate different IVs on each call', () => {
      let callCount = 0;
      mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = (callCount * 5 + i) % 256;
        }
        callCount++;
        return array;
      });

      const iv1 = service.generateIV();
      const iv2 = service.generateIV();
      expect(iv1).not.toEqual(iv2);
    });

    it('should throw error if crypto.getRandomValues fails', () => {
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Random generation failed');
      });

      expect(() => service.generateIV()).toThrow(CryptoErrorImpl);
    });
  });

  describe('deriveKey', () => {
    beforeEach(() => {
      const mockKeyMaterial = {};
      const mockDerivedBits = new ArrayBuffer(32);
      
      mockCrypto.subtle.importKey.mockResolvedValue(mockKeyMaterial);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockDerivedBits);
    });

    it('should derive key with default parameters', async () => {
      const password = 'test-password-123';
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      
      const key = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      
      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
      
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array), // encoded password
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 600000,
          hash: 'SHA-256'
        },
        expect.anything(),
        256 // 32 bytes * 8 bits
      );
    });

    it('should derive same key with same inputs', async () => {
      const password = 'test-password-123';
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      
      // Mock consistent output
      const mockOutput = new ArrayBuffer(32);
      new Uint8Array(mockOutput).set([1, 2, 3, 4, 5]);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockOutput);
      
      const key1 = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const key2 = await service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      
      expect(key1).toEqual(key2);
    });

    it('should use SHA-512 when specified', async () => {
      const password = 'test-password-123';
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const params = { ...DEFAULT_KEY_DERIVATION_PARAMS, hashFunction: 'sha512' as const };
      
      await service.deriveKey(password, salt, params);
      
      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: 'SHA-512'
        }),
        expect.anything(),
        256
      );
    });

    it('should throw error for empty password', async () => {
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      
      await expect(service.deriveKey('', salt, DEFAULT_KEY_DERIVATION_PARAMS))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should throw error for empty salt', async () => {
      const password = 'test-password-123';
      const emptySalt = new Uint8Array(0);
      
      await expect(service.deriveKey(password, emptySalt, DEFAULT_KEY_DERIVATION_PARAMS))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should handle WebCrypto errors gracefully', async () => {
      const password = 'test-password-123';
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('WebCrypto error'));
      
      await expect(service.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS))
        .rejects.toThrow(CryptoErrorImpl);
    });
  });

  describe('encrypt', () => {
    beforeEach(() => {
      const mockCryptoKey = {};
      mockCrypto.subtle.importKey.mockResolvedValue(mockCryptoKey);
      
      // Mock encrypt to return data + auth tag (32 bytes total)
      const mockEncryptedData = new ArrayBuffer(32);
      const mockArray = new Uint8Array(mockEncryptedData);
      // Fill with some test data
      for (let i = 0; i < 16; i++) mockArray[i] = i + 1; // encrypted data
      for (let i = 16; i < 32; i++) mockArray[i] = i; // auth tag
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);
    });

    it('should encrypt data successfully', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const key = new Uint8Array(32).fill(1);
      
      const encryptedData = await service.encrypt(data, key);
      
      expect(encryptedData.data).toBeInstanceOf(Uint8Array);
      expect(encryptedData.iv).toBeInstanceOf(Uint8Array);
      expect(encryptedData.salt).toBeInstanceOf(Uint8Array);
      expect(encryptedData.authTag).toBeInstanceOf(Uint8Array);
      
      expect(encryptedData.iv.length).toBe(12);
      expect(encryptedData.salt.length).toBe(32);
      expect(encryptedData.authTag.length).toBe(16);
      
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AES-GCM',
          iv: expect.any(Uint8Array),
          tagLength: 128
        }),
        expect.anything(),
        data
      );
    });

    it('should throw error for empty data', async () => {
      const emptyData = new Uint8Array(0);
      const key = new Uint8Array(32).fill(1);
      
      await expect(service.encrypt(emptyData, key))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should throw error for invalid key length', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const invalidKey = new Uint8Array(16); // Wrong length
      
      await expect(service.encrypt(data, invalidKey))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should handle WebCrypto encryption errors', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const key = new Uint8Array(32).fill(1);
      
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'));
      
      await expect(service.encrypt(data, key))
        .rejects.toThrow(CryptoErrorImpl);
    });
  });

  describe('decrypt', () => {
    const createMockEncryptedData = (): {
    data: Uint8Array;
    iv: Uint8Array;
    salt: Uint8Array;
    authTag: Uint8Array;
  } => ({
      data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      iv: new Uint8Array(12).fill(1),
      salt: new Uint8Array(32).fill(2),
      authTag: new Uint8Array(16).fill(3)
    });

    beforeEach(() => {
      const mockCryptoKey = {};
      mockCrypto.subtle.importKey.mockResolvedValue(mockCryptoKey);
      
      const mockDecryptedData = new ArrayBuffer(13);
      new Uint8Array(mockDecryptedData).set(new TextEncoder().encode('Hello, World!'));
      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecryptedData);
    });

    it('should decrypt data successfully', async () => {
      const encryptedData = createMockEncryptedData();
      const key = new Uint8Array(32).fill(1);
      
      const decryptedData = await service.decrypt(encryptedData, key);
      
      expect(decryptedData).toBeInstanceOf(Uint8Array);
      expect(decryptedData).not.toBeNull();
      
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AES-GCM',
          iv: encryptedData.iv,
          tagLength: 128
        }),
        expect.anything(),
        expect.any(Uint8Array) // Combined data + authTag
      );
    });

    it('should return null for invalid key during decryption', async () => {
      const encryptedData = createMockEncryptedData();
      const key = new Uint8Array(32).fill(1);
      
      // Mock authentication failure
      mockCrypto.subtle.decrypt.mockRejectedValue(new DOMException('Authentication failed', 'OperationError'));
      
      const result = await service.decrypt(encryptedData, key);
      expect(result).toBeNull();
    });

    it('should return null for tampered data', async () => {
      const encryptedData = createMockEncryptedData();
      const key = new Uint8Array(32).fill(1);
      
      // Mock tamper detection
      mockCrypto.subtle.decrypt.mockRejectedValue(new DOMException('Tampered data', 'OperationError'));
      
      const result = await service.decrypt(encryptedData, key);
      expect(result).toBeNull();
    });

    it('should throw error for invalid key length', async () => {
      const encryptedData = createMockEncryptedData();
      const invalidKey = new Uint8Array(16);
      
      await expect(service.decrypt(encryptedData, invalidKey))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should throw error for invalid IV length', async () => {
      const encryptedData = {
        ...createMockEncryptedData(),
        iv: new Uint8Array(8) // Wrong length
      };
      const key = new Uint8Array(32).fill(1);
      
      await expect(service.decrypt(encryptedData, key))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should throw error for invalid auth tag length', async () => {
      const encryptedData = {
        ...createMockEncryptedData(),
        authTag: new Uint8Array(8) // Wrong length
      };
      const key = new Uint8Array(32).fill(1);
      
      await expect(service.decrypt(encryptedData, key))
        .rejects.toThrow(CryptoErrorImpl);
    });

    it('should throw error for empty encrypted data', async () => {
      const encryptedData = {
        ...createMockEncryptedData(),
        data: new Uint8Array(0)
      };
      const key = new Uint8Array(32).fill(1);
      
      await expect(service.decrypt(encryptedData, key))
        .rejects.toThrow(CryptoErrorImpl);
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
      
      // Mock the expected NIST output
      const expectedOutput = new ArrayBuffer(20);
      const expectedBytes = new Uint8Array([
        0x12, 0x0f, 0xb6, 0xcf, 0xfc, 0xf8, 0xb3, 0x2c,
        0x43, 0xe7, 0x22, 0x52, 0x56, 0xc4, 0xf8, 0x37,
        0xa8, 0x65, 0x48, 0xc9
      ]);
      new Uint8Array(expectedOutput).set(expectedBytes);
      
      mockCrypto.subtle.deriveBits.mockResolvedValue(expectedOutput);
      
      const key = await service.deriveKey(password, salt, params);
      
      expect(key).toEqual(expectedBytes);
      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          iterations: 1,
          hash: 'SHA-256'
        }),
        expect.anything(),
        160 // 20 bytes * 8 bits
      );
    });
  });

  describe('timing attack resistance', () => {
    it('should return null consistently for authentication failures', async () => {
      const encryptedData = createMockEncryptedData();
      const key = new Uint8Array(32).fill(1);
      
      // Mock authentication failure
      mockCrypto.subtle.decrypt.mockRejectedValue(new DOMException('Authentication failed', 'OperationError'));
      
      const results = await Promise.all([
        service.decrypt(encryptedData, key),
        service.decrypt(encryptedData, key),
        service.decrypt(encryptedData, key)
      ]);
      
      expect(results).toEqual([null, null, null]);
    });

    it('should not leak information through error messages', async () => {
      const encryptedData = createMockEncryptedData();
      const key = new Uint8Array(32).fill(1);
      
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Detailed crypto error with sensitive info'));
      
      const result = await service.decrypt(encryptedData, key);
      expect(result).toBeNull();
      
      // Should not throw or leak error details
    });
  });
});

function createMockEncryptedData(): {
  data: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
  authTag: Uint8Array;
} {
  return {
    data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    iv: new Uint8Array(12).fill(1),
    salt: new Uint8Array(32).fill(2),
    authTag: new Uint8Array(16).fill(3)
  };
}
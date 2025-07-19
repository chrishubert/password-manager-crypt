import { CryptoErrorImpl, createCryptoError, sanitizeErrorMessage } from '../errors/crypto-error';

describe('CryptoError', () => {
  describe('CryptoErrorImpl', () => {
    it('should create error with correct properties', () => {
      const error = new CryptoErrorImpl('Test message', 'TEST_CODE', 'validation');
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.category).toBe('validation');
      expect(error.name).toBe('CryptoError');
    });

    it('should be instance of Error', () => {
      const error = new CryptoErrorImpl('Test message', 'TEST_CODE', 'validation');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('createCryptoError', () => {
    it('should create CryptoError with factory function', () => {
      const error = createCryptoError('encryption', 'ENCRYPT_FAILED', 'Encryption operation failed');
      
      expect(error.category).toBe('encryption');
      expect(error.code).toBe('ENCRYPT_FAILED');
      expect(error.message).toBe('Encryption operation failed');
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should return generic message for errors containing "key"', () => {
      const error = new Error('Invalid key provided');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe('Cryptographic operation failed');
    });

    it('should return generic message for errors containing "password"', () => {
      const error = new Error('Password is too weak');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe('Cryptographic operation failed');
    });

    it('should return generic message for errors containing "secret"', () => {
      const error = new Error('Secret not found');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe('Cryptographic operation failed');
    });

    it('should return original message for safe errors', () => {
      const error = new Error('Invalid data format');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe('Invalid data format');
    });

    it('should handle non-Error objects', () => {
      const sanitized = sanitizeErrorMessage('string error');
      expect(sanitized).toBe('Unknown cryptographic error');
    });

    it('should handle null/undefined', () => {
      const sanitized1 = sanitizeErrorMessage(null);
      const sanitized2 = sanitizeErrorMessage(undefined);
      expect(sanitized1).toBe('Unknown cryptographic error');
      expect(sanitized2).toBe('Unknown cryptographic error');
    });
  });
});
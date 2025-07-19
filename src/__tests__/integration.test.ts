import { cryptoServiceFactory } from '../services/crypto-factory';
import { DEFAULT_KEY_DERIVATION_PARAMS } from '../types';

describe('Integration Tests', () => {
  describe('End-to-end password manager workflow', () => {
    it('should complete full encryption/decryption workflow', async () => {
      const cryptoService = cryptoServiceFactory.createForEnvironment('node');
      
      const masterPassword = 'user-master-password-2023';
      const vaultData = JSON.stringify({
        entries: [
          { site: 'example.com', username: 'user@example.com', password: 'site-password-123' },
          { site: 'github.com', username: 'developer', password: 'dev-password-456' }
        ]
      });
      
      const salt = cryptoService.generateSalt();
      const dataToEncrypt = new TextEncoder().encode(vaultData);
      
      const derivedKey = await cryptoService.deriveKey(
        masterPassword, 
        salt, 
        DEFAULT_KEY_DERIVATION_PARAMS
      );
      
      const encryptedVault = await cryptoService.encrypt(dataToEncrypt, derivedKey);
      
      expect(encryptedVault).toHaveProperty('data');
      expect(encryptedVault).toHaveProperty('iv');
      expect(encryptedVault).toHaveProperty('salt');
      expect(encryptedVault).toHaveProperty('authTag');
      
      const decryptedData = await cryptoService.decrypt(encryptedVault, derivedKey);
      expect(decryptedData).not.toBeNull();
      
      const decryptedVault = JSON.parse(new TextDecoder().decode(decryptedData!));
      expect(decryptedVault.entries).toHaveLength(2);
      expect(decryptedVault.entries[0].site).toBe('example.com');
    });

    it('should fail with wrong master password', async () => {
      const cryptoService = cryptoServiceFactory.createForEnvironment('node');
      
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';
      const vaultData = new TextEncoder().encode('sensitive vault data');
      
      const salt = cryptoService.generateSalt();
      
      const correctKey = await cryptoService.deriveKey(
        correctPassword, 
        salt, 
        DEFAULT_KEY_DERIVATION_PARAMS
      );
      
      const wrongKey = await cryptoService.deriveKey(
        wrongPassword, 
        salt, 
        DEFAULT_KEY_DERIVATION_PARAMS
      );
      
      const encryptedVault = await cryptoService.encrypt(vaultData, correctKey);
      const decryptResult = await cryptoService.decrypt(encryptedVault, wrongKey);
      
      expect(decryptResult).toBeNull();
    });

    it('should handle large vault data efficiently', async () => {
      const cryptoService = cryptoServiceFactory.createForEnvironment('node');
      
      const largeVaultData = 'x'.repeat(100000);
      const masterPassword = 'test-password';
      const salt = cryptoService.generateSalt();
      
      const startTime = Date.now();
      
      const key = await cryptoService.deriveKey(masterPassword, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      const encrypted = await cryptoService.encrypt(new TextEncoder().encode(largeVaultData), key);
      const decrypted = await cryptoService.decrypt(encrypted, key);
      
      const endTime = Date.now();
      const operationTime = endTime - startTime;
      
      expect(decrypted).not.toBeNull();
      expect(new TextDecoder().decode(decrypted!)).toBe(largeVaultData);
      expect(operationTime).toBeLessThan(10000);
    });
  });

  describe('Security properties', () => {
    it('should generate unique salts and IVs', async () => {
      const cryptoService = cryptoServiceFactory.createForEnvironment('node');
      
      const salts = new Set();
      const ivs = new Set();
      
      for (let i = 0; i < 100; i++) {
        const salt = cryptoService.generateSalt();
        const iv = cryptoService.generateIV();
        
        salts.add(salt.toString());
        ivs.add(iv.toString());
      }
      
      expect(salts.size).toBe(100);
      expect(ivs.size).toBe(100);
    });

    it('should produce different encrypted outputs for same input', async () => {
      const cryptoService = cryptoServiceFactory.createForEnvironment('node');
      
      const data = new TextEncoder().encode('identical input data');
      const password = 'test-password';
      const salt = cryptoService.generateSalt();
      
      const key = await cryptoService.deriveKey(password, salt, DEFAULT_KEY_DERIVATION_PARAMS);
      
      const encrypted1 = await cryptoService.encrypt(data, key);
      const encrypted2 = await cryptoService.encrypt(data, key);
      
      expect(encrypted1.data).not.toEqual(encrypted2.data);
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
      
      const decrypted1 = await cryptoService.decrypt(encrypted1, key);
      const decrypted2 = await cryptoService.decrypt(encrypted2, key);
      
      expect(decrypted1).toEqual(data);
      expect(decrypted2).toEqual(data);
    });
  });
});
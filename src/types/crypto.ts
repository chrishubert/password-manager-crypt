export interface EncryptedData {
  readonly data: Uint8Array;
  readonly iv: Uint8Array;
  readonly salt: Uint8Array;
  readonly authTag: Uint8Array;
}

export interface KeyDerivationParams {
  readonly iterations: number;
  readonly keyLength: number;
  readonly algorithm: 'pbkdf2';
  readonly hashFunction: 'sha256' | 'sha512';
}

export interface CryptoService {
  deriveKey(password: string, salt: Uint8Array, params: KeyDerivationParams): Promise<Uint8Array>;
  encrypt(data: Uint8Array, key: Uint8Array): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData, key: Uint8Array): Promise<Uint8Array | null>;
  generateSalt(length?: number): Uint8Array;
  generateIV(length?: number): Uint8Array;
}

export interface CryptoServiceFactory {
  createForEnvironment(env: 'node' | 'browser' | 'worker'): CryptoService;
  createForPerformance(level: 'high' | 'medium' | 'low'): CryptoService;
}

export type CryptoEnvironment = 'node' | 'browser' | 'worker';
export type PerformanceLevel = 'high' | 'medium' | 'low';

export interface CryptoError extends Error {
  readonly code: string;
  readonly category: 'key_derivation' | 'encryption' | 'decryption' | 'validation' | 'initialization';
}

export const DEFAULT_KEY_DERIVATION_PARAMS: KeyDerivationParams = {
  iterations: 600000,
  keyLength: 32,
  algorithm: 'pbkdf2',
  hashFunction: 'sha256'
} as const;
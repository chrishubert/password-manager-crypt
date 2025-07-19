import { CryptoError } from '../types';

export class CryptoErrorImpl extends Error implements CryptoError {
  public readonly code: string;
  public readonly category: 'key_derivation' | 'encryption' | 'decryption' | 'validation' | 'initialization';

  constructor(
    message: string,
    code: string,
    category: 'key_derivation' | 'encryption' | 'decryption' | 'validation' | 'initialization'
  ) {
    super(message);
    this.name = 'CryptoError';
    this.code = code;
    this.category = category;
    
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CryptoErrorImpl);
    }
  }
}

export const createCryptoError = (
  category: CryptoError['category'],
  code: string,
  message: string
): CryptoError => {
  return new CryptoErrorImpl(message, code, category);
};

export const sanitizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('key') || message.includes('password') || message.includes('secret')) {
      return 'Cryptographic operation failed';
    }
    return error.message;
  }
  return 'Unknown cryptographic error';
};
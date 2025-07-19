import { CryptoService, CryptoServiceFactory, CryptoEnvironment, PerformanceLevel } from '../types';
import { NodeCryptoService } from './node-crypto';
import { WebCryptoService } from './web-crypto';
import { createCryptoError } from '../errors';

export class DefaultCryptoServiceFactory implements CryptoServiceFactory {
  private isWebCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' && 
           typeof crypto.getRandomValues !== 'undefined';
  }

  private isNodeEnvironment(): boolean {
    try {
      return typeof process !== 'undefined' && 
             typeof process.versions === 'object' &&
             // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
             process.versions !== null &&
             typeof process.versions.node === 'string';
    } catch {
      return false;
    }
  }

  createForEnvironment(env: CryptoEnvironment): CryptoService {
    switch (env) {
      case 'node':
        if (!this.isNodeEnvironment()) {
          throw createCryptoError('initialization', 'ENVIRONMENT_MISMATCH', 'Node.js environment not detected');
        }
        return new NodeCryptoService();
      case 'browser':
      case 'worker':
        if (!this.isWebCryptoAvailable()) {
          throw createCryptoError('initialization', 'WEBCRYPTO_UNAVAILABLE', 'WebCrypto API not available in this environment');
        }
        return new WebCryptoService();
      default: {
        const exhaustiveCheck: never = env;
        throw createCryptoError('initialization', 'UNKNOWN_ENVIRONMENT', `Unknown environment: ${String(exhaustiveCheck)}`);
      }
    }
  }

  createForPerformance(level: PerformanceLevel): CryptoService {
    switch (level) {
      case 'high':
        // Prefer Node.js crypto in Node environment, WebCrypto elsewhere
        if (this.isNodeEnvironment()) {
          return new NodeCryptoService();
        } else if (this.isWebCryptoAvailable()) {
          return new WebCryptoService();
        } else {
          throw createCryptoError('initialization', 'NO_CRYPTO_AVAILABLE', 'No suitable crypto implementation available');
        }
      case 'medium':
      case 'low':
        // Use WebCrypto for universal compatibility
        if (this.isWebCryptoAvailable()) {
          return new WebCryptoService();
        } else if (this.isNodeEnvironment()) {
          return new NodeCryptoService();
        } else {
          throw createCryptoError('initialization', 'NO_CRYPTO_AVAILABLE', 'No suitable crypto implementation available');
        }
      default: {
        const exhaustiveCheck: never = level;
        throw createCryptoError('initialization', 'UNKNOWN_PERFORMANCE_LEVEL', `Unknown performance level: ${String(exhaustiveCheck)}`);
      }
    }
  }
}

export const cryptoServiceFactory = new DefaultCryptoServiceFactory();
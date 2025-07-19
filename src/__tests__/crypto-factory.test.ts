import { cryptoServiceFactory, DefaultCryptoServiceFactory } from '../services/crypto-factory';
import { NodeCryptoService } from '../services/node-crypto';
import { WebCryptoService } from '../services/web-crypto';
import { CryptoErrorImpl } from '../errors';

describe('DefaultCryptoServiceFactory', () => {
  let factory: DefaultCryptoServiceFactory;

  beforeEach(() => {
    factory = new DefaultCryptoServiceFactory();
  });

  describe('createForEnvironment', () => {
    it('should create NodeCryptoService for node environment', () => {
      const service = factory.createForEnvironment('node');
      expect(service).toBeInstanceOf(NodeCryptoService);
    });

    it('should create WebCryptoService for browser environment when crypto available', () => {
      // Mock crypto availability
      const mockCrypto = {
        subtle: { importKey: jest.fn() },
        getRandomValues: jest.fn()
      };
      Object.defineProperty(global, 'crypto', { value: mockCrypto, configurable: true });
      
      const service = factory.createForEnvironment('browser');
      expect(service).toBeInstanceOf(WebCryptoService);
      
      delete (global as unknown as { crypto?: unknown }).crypto;
    });

    it('should create WebCryptoService for worker environment when crypto available', () => {
      // Mock crypto availability
      const mockCrypto = {
        subtle: { importKey: jest.fn() },
        getRandomValues: jest.fn()
      };
      Object.defineProperty(global, 'crypto', { value: mockCrypto, configurable: true });
      
      const service = factory.createForEnvironment('worker');
      expect(service).toBeInstanceOf(WebCryptoService);
      
      delete (global as unknown as { crypto?: unknown }).crypto;
    });

    it('should throw error for browser environment when crypto unavailable', () => {
      delete (global as unknown as { crypto?: unknown }).crypto;
      expect(() => factory.createForEnvironment('browser'))
        .toThrow(CryptoErrorImpl);
    });

    it('should throw error for worker environment when crypto unavailable', () => {
      delete (global as unknown as { crypto?: unknown }).crypto;
      expect(() => factory.createForEnvironment('worker'))
        .toThrow(CryptoErrorImpl);
    });

    it('should throw error for node environment when not in Node.js', () => {
      // Mock non-Node environment by making process access throw
      const originalProcess = global.process;
      Object.defineProperty(global, 'process', {
        get() { throw new Error('process is not defined'); },
        configurable: true
      });
      
      expect(() => factory.createForEnvironment('node'))
        .toThrow(CryptoErrorImpl);
        
      Object.defineProperty(global, 'process', { value: originalProcess, configurable: true });
    });

    it('should throw error for unknown environment', () => {
      expect(() => factory.createForEnvironment('unknown' as never))
        .toThrow(CryptoErrorImpl);
    });
  });

  describe('createForPerformance', () => {
    it('should create NodeCryptoService for high performance in Node environment', () => {
      const service = factory.createForPerformance('high');
      expect(service).toBeInstanceOf(NodeCryptoService);
    });

    it('should create WebCryptoService for medium performance when crypto available', () => {
      // Mock crypto availability
      const mockCrypto = {
        subtle: { importKey: jest.fn() },
        getRandomValues: jest.fn()
      };
      Object.defineProperty(global, 'crypto', { value: mockCrypto, configurable: true });
      
      const service = factory.createForPerformance('medium');
      expect(service).toBeInstanceOf(WebCryptoService);
      
      delete (global as unknown as { crypto?: unknown }).crypto;
    });

    it('should create WebCryptoService for low performance when crypto available', () => {
      // Mock crypto availability
      const mockCrypto = {
        subtle: { importKey: jest.fn() },
        getRandomValues: jest.fn()
      };
      Object.defineProperty(global, 'crypto', { value: mockCrypto, configurable: true });
      
      const service = factory.createForPerformance('low');
      expect(service).toBeInstanceOf(WebCryptoService);
      
      delete (global as unknown as { crypto?: unknown }).crypto;
    });

    it('should fallback to NodeCryptoService when crypto unavailable', () => {
      delete (global as unknown as { crypto?: unknown }).crypto;
      const service = factory.createForPerformance('medium');
      expect(service).toBeInstanceOf(NodeCryptoService);
    });

    it('should throw error for high performance when no crypto available in non-Node environment', () => {
      // Mock non-Node environment 
      const originalProcess = global.process;
      Object.defineProperty(global, 'process', {
        get() { throw new Error('process is not defined'); },
        configurable: true
      });
      delete (global as unknown as { crypto?: unknown }).crypto;
      
      expect(() => factory.createForPerformance('high'))
        .toThrow(CryptoErrorImpl);
        
      Object.defineProperty(global, 'process', { value: originalProcess, configurable: true });
    });

    it('should throw error for medium performance when no crypto available in non-Node environment', () => {
      // Mock non-Node environment
      const originalProcess = global.process;
      Object.defineProperty(global, 'process', {
        get() { throw new Error('process is not defined'); },
        configurable: true
      });
      delete (global as unknown as { crypto?: unknown }).crypto;
      
      expect(() => factory.createForPerformance('medium'))
        .toThrow(CryptoErrorImpl);
        
      Object.defineProperty(global, 'process', { value: originalProcess, configurable: true });
    });

    it('should throw error for unknown performance level', () => {
      expect(() => factory.createForPerformance('unknown' as never))
        .toThrow(CryptoErrorImpl);
    });
  });

  describe('cryptoServiceFactory singleton', () => {
    it('should export factory instance', () => {
      expect(cryptoServiceFactory).toBeInstanceOf(DefaultCryptoServiceFactory);
    });

    it('should create services using singleton', () => {
      const service = cryptoServiceFactory.createForEnvironment('node');
      expect(service).toBeInstanceOf(NodeCryptoService);
    });
  });
});
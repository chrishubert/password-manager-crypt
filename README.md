# Password Manager Cryptographic Library

[![CI/CD Pipeline](https://github.com/chrishubert/password-manager-crypt/actions/workflows/ci.yml/badge.svg)](https://github.com/chrishubert/password-manager-crypt/actions/workflows/ci.yml)
[![Security Checks](https://github.com/chrishubert/password-manager-crypt/actions/workflows/security.yml/badge.svg)](https://github.com/chrishubert/password-manager-crypt/actions/workflows/security.yml)
[![npm version](https://badge.fury.io/js/password-manager-crypt.svg)](https://badge.fury.io/js/password-manager-crypt)

A secure, zero-dependency cryptographic library designed specifically for password managers, implementing industry-standard encryption with zero-knowledge architecture principles. 

**✅ Universal Support**: Works seamlessly across **Node.js**, **CloudFlare Workers**, and **Browsers**.

## Features

- **🌍 Universal Runtime Support**: Node.js, CloudFlare Workers, and Browser environments
- **⚡ Performance Optimized**: WebCrypto API provides 2-15x performance boost for large operations
- **🔐 AES-256-GCM encryption** with authenticated encryption
- **🔑 PBKDF2 key derivation** with configurable iterations (default: 600,000)
- **📦 Zero dependencies** for minimal attack surface
- **🏗️ TypeScript support** with comprehensive type definitions
- **⏱️ Constant-time operations** to prevent timing attacks
- **🛡️ Sanitized error handling** to prevent information leakage
- **✅ NIST-compliant algorithms** for regulatory compliance
- **🏭 Smart factory pattern** with automatic environment detection

## Installation

```bash
npm install password-manager-crypt
```

## Quick Start

### Universal Usage (Auto-Detection)

```typescript
import { cryptoServiceFactory, DEFAULT_KEY_DERIVATION_PARAMS } from 'password-manager-crypt';

// Automatic environment detection and optimal performance selection
const cryptoService = cryptoServiceFactory.createForPerformance('high');
```

### Environment-Specific Usage

```typescript
// Node.js
const nodeService = cryptoServiceFactory.createForEnvironment('node');

// CloudFlare Workers
const workerService = cryptoServiceFactory.createForEnvironment('worker');

// Browser
const browserService = cryptoServiceFactory.createForEnvironment('browser');
```

### Complete Example

```typescript
// Encrypt vault data
async function encryptVault(masterPassword: string, vaultData: string): Promise<{
  encryptedData: EncryptedData;
  salt: Uint8Array;
}> {
  // Generate unique salt for this vault
  const salt = cryptoService.generateSalt();
  
  // Derive encryption key from master password
  const key = await cryptoService.deriveKey(
    masterPassword, 
    salt, 
    DEFAULT_KEY_DERIVATION_PARAMS
  );
  
  // Encrypt the vault data
  const encryptedData = await cryptoService.encrypt(
    new TextEncoder().encode(vaultData), 
    key
  );
  
  return { encryptedData, salt };
}

// Decrypt vault data
async function decryptVault(
  masterPassword: string, 
  salt: Uint8Array, 
  encryptedData: EncryptedData
): Promise<string | null> {
  // Derive decryption key
  const key = await cryptoService.deriveKey(
    masterPassword, 
    salt, 
    DEFAULT_KEY_DERIVATION_PARAMS
  );
  
  // Decrypt the vault data
  const decryptedBytes = await cryptoService.decrypt(encryptedData, key);
  
  if (!decryptedBytes) {
    return null; // Invalid password or tampered data
  }
  
  return new TextDecoder().decode(decryptedBytes);
}
```

## API Reference

### CryptoService Interface

#### `deriveKey(password: string, salt: Uint8Array, params: KeyDerivationParams): Promise<Uint8Array>`

Derives a cryptographic key from a password using PBKDF2.

```typescript
const salt = cryptoService.generateSalt();
const key = await cryptoService.deriveKey('user-password', salt, {
  iterations: 600000,
  keyLength: 32,
  algorithm: 'pbkdf2',
  hashFunction: 'sha256'
});
```

#### `encrypt(data: Uint8Array, key: Uint8Array): Promise<EncryptedData>`

Encrypts data using AES-256-GCM with a random IV.

```typescript
const data = new TextEncoder().encode('sensitive data');
const encryptedData = await cryptoService.encrypt(data, key);
// Returns: { data, iv, salt, authTag }
```

#### `decrypt(encryptedData: EncryptedData, key: Uint8Array): Promise<Uint8Array | null>`

Decrypts data and verifies authentication tag. Returns `null` if decryption fails.

```typescript
const decryptedData = await cryptoService.decrypt(encryptedData, key);
if (decryptedData) {
  const plaintext = new TextDecoder().decode(decryptedData);
}
```

#### `generateSalt(length?: number): Uint8Array`

Generates a cryptographically secure random salt (default: 32 bytes).

```typescript
const salt = cryptoService.generateSalt(); // 32 bytes
const customSalt = cryptoService.generateSalt(16); // 16 bytes
```

#### `generateIV(length?: number): Uint8Array`

Generates a cryptographically secure random IV (default: 12 bytes for GCM).

```typescript
const iv = cryptoService.generateIV(); // 12 bytes for AES-GCM
```

### Factory Pattern

#### `cryptoServiceFactory.createForEnvironment(env)`

Creates a crypto service optimized for the specified environment:

```typescript
// Node.js environment (uses Node.js crypto module)
const nodeService = cryptoServiceFactory.createForEnvironment('node');

// CloudFlare Workers (uses WebCrypto API)
const workerService = cryptoServiceFactory.createForEnvironment('worker');

// Browser environment (uses WebCrypto API)
const browserService = cryptoServiceFactory.createForEnvironment('browser');
```

#### `cryptoServiceFactory.createForPerformance(level)`

Creates a crypto service optimized for the specified performance level:

```typescript
// High performance: Prefers Node.js crypto, falls back to WebCrypto
const highPerfService = cryptoServiceFactory.createForPerformance('high');

// Medium/Low performance: Prefers WebCrypto for universal compatibility
const mediumPerfService = cryptoServiceFactory.createForPerformance('medium');
```

### Types

#### `EncryptedData`

```typescript
interface EncryptedData {
  readonly data: Uint8Array;      // Encrypted data
  readonly iv: Uint8Array;        // Initialization vector
  readonly salt: Uint8Array;      // Salt for key derivation
  readonly authTag: Uint8Array;   // Authentication tag
}
```

#### `KeyDerivationParams`

```typescript
interface KeyDerivationParams {
  readonly iterations: number;    // PBKDF2 iterations (recommend 600,000+)
  readonly keyLength: number;     // Output key length in bytes
  readonly algorithm: 'pbkdf2';   // Algorithm type
  readonly hashFunction: 'sha256' | 'sha512'; // Hash function
}
```

## Security Best Practices

### Password Requirements

```typescript
// Use strong, unique master passwords
const masterPassword = 'MySecure!MasterPassword2024';

// Always use unique salts per vault
const salt = cryptoService.generateSalt();
```

### Error Handling

```typescript
try {
  const key = await cryptoService.deriveKey(password, salt, params);
  const encrypted = await cryptoService.encrypt(data, key);
} catch (error) {
  if (error instanceof CryptoError) {
    console.log(`Crypto operation failed: ${error.category}`);
    // Error messages are sanitized automatically
  }
}
```

### Memory Management

```typescript
// Clear sensitive data when done (best effort)
const clearArray = (arr: Uint8Array): void => {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 0;
  }
};

// Use and clear
const key = await cryptoService.deriveKey(password, salt, params);
// ... use key for encryption/decryption
clearArray(key);
```

## Environment-Specific Usage

### CloudFlare Workers

```typescript
// wrangler.toml (optional - enables Node.js crypto compatibility)
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-09-23"

// worker.js
import { cryptoServiceFactory } from 'password-manager-crypt';

export default {
  async fetch(request, env, ctx) {
    // Use WebCrypto for maximum compatibility
    const cryptoService = cryptoServiceFactory.createForEnvironment('worker');
    
    const vault = await encryptVault('master-password', 'sensitive-data');
    return new Response(JSON.stringify(vault));
  }
};
```

### Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { cryptoServiceFactory } from 'https://unpkg.com/password-manager-crypt/dist/index.esm.js';
    
    // Browser environment with WebCrypto
    const cryptoService = cryptoServiceFactory.createForEnvironment('browser');
    
    async function handlePasswordStorage() {
      const vault = await encryptVault('user-password', 'user-data');
      localStorage.setItem('encrypted-vault', JSON.stringify(vault));
    }
  </script>
</head>
</html>
```

### Node.js Server

```typescript
import { cryptoServiceFactory } from 'password-manager-crypt';

// High-performance Node.js crypto
const cryptoService = cryptoServiceFactory.createForEnvironment('node');

// Express.js route example
app.post('/encrypt-vault', async (req, res) => {
  const { password, data } = req.body;
  const vault = await encryptVault(password, data);
  res.json(vault);
});
```

## Performance Considerations

### Environment Performance Comparison

| Environment | Implementation | Relative Performance | Best For |
|-------------|----------------|---------------------|----------|
| Node.js | Native crypto module | 🔥🔥🔥 Fastest (3x) | Server-side, CLI tools |
| CloudFlare Workers | WebCrypto API | 🔥🔥 Fast (2-15x) | Edge computing, APIs |
| Browser | WebCrypto API | 🔥🔥 Fast (2-15x) | Client-side encryption |

### Key Derivation

- PBKDF2 with 600,000 iterations:
  - **Node.js**: ~300ms 
  - **WebCrypto**: ~400-500ms 
- Consider caching derived keys in memory for session duration
- Use Web Workers in browsers for non-blocking key derivation

### Encryption Performance

- **Large data (>1MB)**: All implementations benefit from native crypto APIs
- **Small data (<10KB)**: WebCrypto has lower initialization overhead
- **Streaming**: Consider chunked encryption for very large datasets

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
# Build all formats
npm run build

# Build specific formats
npm run build:cjs    # CommonJS
npm run build:esm    # ES Modules
npm run build:types  # TypeScript declarations
```

## Security Audit Status

This library implements well-established cryptographic algorithms and follows security best practices:

- **Algorithms**: AES-256-GCM (NIST approved), PBKDF2-SHA256 (NIST approved)
- **Key derivation**: 600,000+ iterations (exceeds OWASP recommendations)
- **Random generation**: Uses Node.js crypto.randomBytes (CSPRNG)
- **Authentication**: GCM mode provides built-in authenticated encryption

**Note**: This library has not yet undergone formal cryptographic audit. For production use in critical applications, consider professional security review.

## CI/CD Pipeline

This project uses comprehensive GitHub Actions workflows for quality assurance:

### 🔄 **Continuous Integration** (`ci.yml`)
- **Multi-Node.js testing**: Tests on Node.js 16, 18, 20, 22
- **Cross-platform validation**: Ubuntu, Windows, macOS
- **Quality checks**: Linting, type checking, test coverage
- **Build verification**: Validates all module formats (CJS, ESM, TypeScript)

### 🔒 **Security Monitoring** (`security.yml`)
- **CodeQL analysis**: Static security scanning
- **Dependency auditing**: Weekly vulnerability checks
- **License compliance**: Ensures compatible licenses only
- **Supply chain security**: Dependency review on PRs

### 🚀 **Automated Releases** (`release.yml`)
- **Tag-triggered releases**: Automatically publishes on version tags
- **NPM publishing**: With provenance attestation for supply chain security
- **GitHub releases**: Auto-generated changelogs and artifacts

### 📦 **Package Publishing**
```bash
# Create and publish a release
git tag v1.0.0
git push origin v1.0.0
# CI automatically builds, tests, and publishes to NPM
```

### 🔧 **Required Secrets**
Set these in your GitHub repository settings:
- `NPM_TOKEN`: NPM authentication token with publish permissions

## License

Apache 2.0 - See [LICENSE](LICENSE) file for details.

## Contributing

1. Follow existing code style and patterns
2. Add comprehensive tests for new features
3. Ensure all security checks pass
4. Update documentation as needed

## Support

- GitHub Issues: Report bugs and request features
- Security Issues: Contact maintainers privately for security vulnerabilities

## Migration Guide

### From v0.1.x to v0.2.x

All `encrypt` and `decrypt` methods are now async for consistency across environments:

```typescript
// Before (v0.1.x)
const encrypted = cryptoService.encrypt(data, key);
const decrypted = cryptoService.decrypt(encrypted, key);

// After (v0.2.x)
const encrypted = await cryptoService.encrypt(data, key);
const decrypted = await cryptoService.decrypt(encrypted, key);
```

## Browser Compatibility

| Browser | WebCrypto Support | Status |
|---------|------------------|--------|
| Chrome 37+ | ✅ Full support | Recommended |
| Firefox 34+ | ✅ Full support | Recommended |
| Safari 7+ | ✅ Full support | Recommended |
| Edge 12+ | ✅ Full support | Recommended |
| IE | ❌ Not supported | Use polyfill |

## CloudFlare Workers Compatibility

| Feature | Status | Notes |
|---------|--------|-------|
| WebCrypto API | ✅ Full support | Recommended approach |
| Node.js crypto | ✅ With nodejs_compat flag | Optional for compatibility |
| Performance | 🔥🔥 Excellent | 2-15x faster than pure JS |

## Changelog

### v0.2.0

- ✅ **Universal Runtime Support**: CloudFlare Workers and Browser environments
- ✅ **WebCrypto Implementation**: 2-15x performance improvement for large operations
- ✅ **Smart Factory Pattern**: Automatic environment detection and optimization
- ✅ **Consistent Async API**: All crypto operations now return Promises
- ✅ **Comprehensive Testing**: 72 tests including NIST test vectors
- ✅ **Security Maintained**: All timing attack protections preserved
- 🔄 **Breaking Change**: encrypt/decrypt methods now async

### v0.1.0

- Initial release with Node.js support
- AES-256-GCM encryption/decryption
- PBKDF2 key derivation
- Comprehensive test suite
- TypeScript support
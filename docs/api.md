# API Reference

## CryptoService Interface

The core interface providing cryptographic operations across all environments.

### Methods

#### `deriveKey(password: string, salt: Uint8Array, params: KeyDerivationParams): Promise<Uint8Array>`

Derives a cryptographic key from a password using PBKDF2.

**Parameters:**
- `password`: Master password string
- `salt`: Unique salt (32 bytes recommended)
- `params`: Key derivation parameters

**Returns:** Promise resolving to derived key (Uint8Array)

**Example:**
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

**Parameters:**
- `data`: Data to encrypt (Uint8Array)
- `key`: Encryption key (32 bytes)

**Returns:** Promise resolving to EncryptedData object

**Example:**
```typescript
const data = new TextEncoder().encode('sensitive data');
const encryptedData = await cryptoService.encrypt(data, key);
```

#### `decrypt(encryptedData: EncryptedData, key: Uint8Array): Promise<Uint8Array | null>`

Decrypts data and verifies authentication tag. Returns `null` if decryption fails.

**Parameters:**
- `encryptedData`: Encrypted data object
- `key`: Decryption key (32 bytes)

**Returns:** Promise resolving to decrypted data or null

**Example:**
```typescript
const decryptedData = await cryptoService.decrypt(encryptedData, key);
if (decryptedData) {
  const plaintext = new TextDecoder().decode(decryptedData);
}
```

#### `generateSalt(length?: number): Uint8Array`

Generates a cryptographically secure random salt.

**Parameters:**
- `length`: Salt length in bytes (default: 32)

**Returns:** Random salt (Uint8Array)

**Example:**
```typescript
const salt = cryptoService.generateSalt(); // 32 bytes
const customSalt = cryptoService.generateSalt(16); // 16 bytes
```

#### `generateIV(length?: number): Uint8Array`

Generates a cryptographically secure random IV.

**Parameters:**
- `length`: IV length in bytes (default: 12 for GCM)

**Returns:** Random IV (Uint8Array)

**Example:**
```typescript
const iv = cryptoService.generateIV(); // 12 bytes for AES-GCM
```

## Factory Pattern

### `cryptoServiceFactory.createForEnvironment(env: RuntimeEnvironment)`

Creates a crypto service optimized for the specified environment.

**Parameters:**
- `env`: Target environment ('node' | 'browser' | 'worker')

**Returns:** CryptoService instance

**Example:**
```typescript
// Node.js environment (uses Node.js crypto module)
const nodeService = cryptoServiceFactory.createForEnvironment('node');

// CloudFlare Workers (uses WebCrypto API)
const workerService = cryptoServiceFactory.createForEnvironment('worker');

// Browser environment (uses WebCrypto API)
const browserService = cryptoServiceFactory.createForEnvironment('browser');
```

### `cryptoServiceFactory.createForPerformance(level: PerformanceLevel)`

Creates a crypto service optimized for the specified performance level.

**Parameters:**
- `level`: Performance level ('high' | 'medium' | 'low')

**Returns:** CryptoService instance

**Example:**
```typescript
// High performance: Prefers Node.js crypto, falls back to WebCrypto
const highPerfService = cryptoServiceFactory.createForPerformance('high');

// Medium/Low performance: Prefers WebCrypto for universal compatibility
const mediumPerfService = cryptoServiceFactory.createForPerformance('medium');
```

## Types

### `EncryptedData`

Container for encrypted data and metadata.

```typescript
interface EncryptedData {
  readonly data: Uint8Array;      // Encrypted data
  readonly iv: Uint8Array;        // Initialization vector (12 bytes)
  readonly salt: Uint8Array;      // Salt for key derivation (32 bytes)
  readonly authTag: Uint8Array;   // Authentication tag (16 bytes)
}
```

### `KeyDerivationParams`

Parameters for key derivation operations.

```typescript
interface KeyDerivationParams {
  readonly iterations: number;    // PBKDF2 iterations (recommend 600,000+)
  readonly keyLength: number;     // Output key length in bytes (32 for AES-256)
  readonly algorithm: 'pbkdf2';   // Algorithm type
  readonly hashFunction: 'sha256' | 'sha512'; // Hash function
}
```

### `DEFAULT_KEY_DERIVATION_PARAMS`

Pre-configured secure defaults for key derivation.

```typescript
const DEFAULT_KEY_DERIVATION_PARAMS: KeyDerivationParams = {
  iterations: 600000,
  keyLength: 32,
  algorithm: 'pbkdf2',
  hashFunction: 'sha256'
};
```

## Error Handling

### `CryptoError`

Custom error type for cryptographic operations.

**Properties:**
- `name`: 'CryptoError'
- `message`: Sanitized error message
- `category`: Error category for debugging

**Example:**
```typescript
try {
  const key = await cryptoService.deriveKey(password, salt, params);
} catch (error) {
  if (error instanceof CryptoError) {
    console.log(`Crypto operation failed: ${error.category}`);
    // Error messages are automatically sanitized
  }
}
```

### Error Categories

- `'key-derivation'`: Key derivation failures
- `'encryption'`: Encryption operation failures  
- `'decryption'`: Decryption operation failures
- `'validation'`: Input validation failures
- `'environment'`: Environment detection failures

## Security Considerations

### Constant-Time Operations

All cryptographic operations are designed to be constant-time to prevent timing attacks:

- Authentication failures return `null` consistently
- No early returns based on data content
- Error messages are sanitized to prevent information leakage

### Memory Management

While JavaScript doesn't provide secure memory clearing, the library follows best practices:

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

### Input Validation

All methods perform comprehensive input validation:

- Key lengths are validated (32 bytes for AES-256)
- IV lengths are validated (12 bytes for GCM)
- Salt lengths are validated (minimum 16 bytes)
- Data arrays are validated for proper format
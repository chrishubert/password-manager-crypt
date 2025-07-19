# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **universal password manager cryptographic library** project focused on building secure, open-source cryptographic libraries following zero-knowledge architecture principles. The project emphasizes clean separation between cryptographic operations and business logic.

**Current Status**: ✅ **Production Ready v0.2.0** with full support for Node.js, CloudFlare Workers, and Browser environments.

## Architecture Principles

IMPORTANT!: Read carefully ./CONTEXT.md to understand the context before proceeding

The codebase follows a four-layer zero-knowledge architecture:
1. **Cryptographic primitives** - Core encryption, hashing, key derivation operations
2. **Application coordination** - Vault operations and synchronization logic  
3. **Infrastructure services** - Storage and networking components
4. **Presentation interfaces** - UI and API endpoints

**Dependency rule**: Inner crypto layers must remain completely independent of outer business layers.

## TypeScript API Design Patterns

✅ **IMPLEMENTED**: Following established patterns from audited libraries like TweetNaCl and libsodium:
- ✅ **Specific types**: `Uint8Array` used throughout, no generic arrays
- ✅ **Promise-based patterns**: Universal async interface for consistency
- ✅ **Encoding utilities**: Built-in TextEncoder/TextDecoder integration
- ✅ **Constant-time operations**: WebCrypto and Node.js crypto provide timing safety
- ✅ **Null returns**: Authentication failures return `null`, never throw exceptions for timing safety

**API Consistency**: Same interface works identically across Node.js, Workers, and Browsers.

## Security Requirements

✅ **ALL IMPLEMENTED AND VERIFIED**:
- ✅ **Zero dependencies**: Production build has zero dependencies, minimal attack surface
- ✅ **Constant-time operations**: WebCrypto and Node.js crypto provide timing-safe implementations
- ✅ **Error sanitization**: `sanitizeErrorMessage()` removes sensitive data from all error outputs  
- ✅ **Input validation**: Comprehensive validation for all parameters (keys, data, salts, IVs)
- ✅ **Memory management**: Keys cleared where possible, WebCrypto handles memory securely

**Security Validation**: All implementations tested for timing attack resistance and data sanitization.

## Implementation Strategy

✅ **COMPLETED**: Multi-provider crypto implementation using strategy pattern:
- **Node.js crypto module**: ✅ Implemented - Fastest performance for server environments
- **WebCrypto API**: ✅ Implemented - Maximum performance (2-15x improvement) for CloudFlare Workers and browsers
- **Smart factory pattern**: ✅ Implemented - Automatic environment detection and optimal provider selection

**Current Architecture**:
```
src/
├── services/
│   ├── node-crypto.ts      # Node.js native crypto implementation
│   ├── web-crypto.ts       # WebCrypto API implementation  
│   └── crypto-factory.ts   # Smart factory with environment detection
├── types/
│   └── crypto.ts          # Universal async interface
└── errors/
    └── crypto-error.ts    # Sanitized error handling
```

## Testing Requirements

✅ **COMPLETED**: Comprehensive crypto-specific testing implemented:
- ✅ **NIST standard test vectors**: PBKDF2-SHA256 test vectors validated
- ✅ **Property-based testing**: Uniqueness testing for salts/IVs, encryption determinism
- ✅ **Performance benchmarking**: Integration tests with performance thresholds
- ✅ **Timing attack resistance**: Consistent null returns for authentication failures
- ✅ **Cross-environment testing**: Validation across Node.js, WebCrypto implementations
- ✅ **Error handling**: Comprehensive validation error testing

**Test Coverage**: 72 passing tests across 5 test suites covering all security requirements.

## Legal and Compliance

- Use Apache 2.0 licensing for patent protection and enterprise compatibility
- Implement FIPS-approved algorithms (AES-256, SHA-2, RSA, ECDSA)
- Standard cryptographic implementations require no additional export compliance
- Include export control notices in documentation

## Security Audit Preparation

- Maintain comprehensive documentation of cryptographic assumptions
- Document algorithm specifications and implementation decisions
- Keep clear module boundaries with minimal audit surface area
- Plan for professional security audits (typically $100K+ with 6-12 month timelines)

## NPM Publishing Security

✅ **COMPLETED**: Production-ready NPM package configuration:
- ✅ **Provenance attestation**: Enabled with `"provenance": true` in package.json
- ✅ **Multiple module formats**: CommonJS, ES modules, and TypeScript declarations
- ✅ **Comprehensive TypeScript definitions**: Full type safety across all environments
- ✅ **Security-first dependencies**: Zero production dependencies maintained
- ⚠️ **Publishing checklist**: 2FA and granular access tokens (configure before publishing)

## Current Implementation Status

### ✅ **Completed Features**
- **Universal runtime support**: Node.js, CloudFlare Workers, Browser environments
- **WebCrypto implementation**: Full AES-256-GCM + PBKDF2 support
- **Smart factory pattern**: Automatic environment detection and optimization
- **Security guarantees**: All timing attack protections and input validation maintained
- **Comprehensive testing**: 72 tests including NIST vectors and cross-environment validation
- **Production build**: Clean compilation with linting and type checking

### 🔄 **Breaking Changes in v0.2.0**
- **Async interface**: All `encrypt()` and `decrypt()` methods now return Promises
- **Universal compatibility**: Same API works across all supported environments

### 📋 **Future Considerations**
- **WebAssembly support**
- **Streaming APIs**: For large file encryption scenarios
- **Hardware security**: WebAuthn integration for hardware-backed key storage

## Development Commands

```bash
# Test all environments
npm test

# Build for production  
npm run build

# Lint and type check
npm run lint && npm run typecheck

# Test specific environment
npm test -- --testPathPattern=web-crypto
```

## Local GitHub Actions Testing

Use `act` to test GitHub Actions workflows locally before pushing:

```bash
# Validate all workflow syntax
act --validate

# Dry run all workflows for push event
act -n push

# Test specific job (dry run)
act -n -j security
act -n -j build

# Test with specific Node.js matrix
act push -j test --matrix node-version:20

# List all available workflows and jobs
act --list
```

**Configuration**: Act is configured to use `catthehacker/ubuntu:act-latest` medium Docker image in `~/.local/act/actrc`.

## Important Implementation Notes

### Environment Detection
The factory automatically detects the runtime environment and selects optimal crypto providers:
- **Node.js**: Detects `process.versions.node` 
- **Browser/Worker**: Detects `crypto.subtle` availability
- **Fallbacks**: Graceful degradation when APIs unavailable

### Performance Characteristics  
- **Node.js crypto**: ~300ms for 600K PBKDF2 iterations
- **WebCrypto API**: ~400-500ms for same operations, but 2-15x faster for large data encryption
- **Auto-selection**: `createForPerformance('high')` chooses optimal implementation

### Security Guarantees Maintained
- All timing attack protections preserved across implementations
- Input validation identical across all environments  
- Error sanitization prevents information leakage
- Authentication failures consistently return `null` never throw
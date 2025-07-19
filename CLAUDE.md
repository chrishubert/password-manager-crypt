# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **universal password manager cryptographic library** project focused on building secure, open-source cryptographic libraries following zero-knowledge architecture principles. The project emphasizes clean separation between cryptographic operations and business logic.

**Current Status**: ✅ **Production Ready v0.2.0** with full support for Node.js, CloudFlare Workers, and Browser environments. **Published to NPM** with provenance attestation.

## Architecture Principles

IMPORTANT!: Read carefully ./CONTEXT.md to understand the context before proceeding

The codebase follows a four-layer zero-knowledge architecture:
1. **Cryptographic primitives** - Core encryption, hashing, key derivation operations
2. **Application coordination** - Vault operations and synchronization logic  
3. **Infrastructure services** - Storage and networking components
4. **Presentation interfaces** - UI and API endpoints

**Dependency rule**: Inner crypto layers must remain completely independent of outer business layers.

## Development Methodology

✅ **Test-First Development**: This project follows a strict test-first development approach:
- **Write tests before implementation**: All new features require comprehensive tests before any code
- **Security-focused testing**: Crypto operations must include timing attack resistance tests
- **Cross-environment validation**: All features tested across Node.js, WebCrypto implementations
- **NIST compliance testing**: Standard test vectors validated for all algorithms
- **85 tests maintained**: Comprehensive test suite with >95% coverage for all crypto operations

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

## Test Coverage

Check test coverage before committing:

```bash
# Run tests with coverage report
npm run test:coverage

# Coverage thresholds (configured in jest.config.ts): 90% minimum for all metrics
# Current status: 95.23% statements, 97.4% branches, 100% functions, 95.18% lines
```

**Coverage Requirements**: 
- **Minimum**: 90% statements, branches, functions, lines (enforced by Jest)
- **Target**: >95% for security-critical crypto operations
- **Mandatory**: 100% function coverage - every crypto function must be tested
- **Required**: Comprehensive error scenario testing for all crypto operations

## Local GitHub Actions Testing

Use `act` strategically for different validation levels:

### **Level 1: Workflow Syntax Validation (Fast)**
```bash
# Validate all workflow YAML syntax and structure
act --validate

# List all available workflows and jobs  
act --list

# Dry run for workflow structure verification (syntax only)
act -n push
act -n -j security
act -n -j build
```

### **Level 2: Real Execution Testing (Slower but Comprehensive)**
```bash
# Actually execute workflows (not just syntax check)
act push -j security        # Run security job completely
act push -j build          # Run build job completely

# Test specific Node.js matrix combinations
act push -j test --matrix node-version:18
act push -j test --matrix node-version:20

# Run with verbose output for debugging
act push -j test -v
```

### **Level 3: Cross-platform Testing**
```bash
# Note: Act cannot test Windows/macOS - use GitHub Actions for full coverage
# Act limitations:
# - Only tests Ubuntu containers
# - Environment differences from GitHub runners  
# - Test mocking may behave differently
```

**Act Best Practices**:
- **Dry run (`-n`)**: Quick workflow syntax validation only
- **Real execution**: Catches more issues but takes longer and may miss environment-specific problems
- **GitHub Actions**: Ultimate truth for cross-platform and environment-sensitive tests
- **Defense in depth**: Local tests + Act validation + GitHub CI

**Configuration**: Act is configured to use `catthehacker/ubuntu:act-latest` medium Docker image in `~/.local/act/actrc`.

## Release Management

✅ **NPM Publishing Workflow**: 
- **No manual retagging**: README updates and documentation changes don't require new release tags
- **Repository field required**: package.json must include repository URL for NPM provenance attestation
- **GitHub Actions handles releases**: Automated workflow publishes to NPM on tag creation
- **Workflow resilience**: Release creation step handles existing releases gracefully

## Repository Security

✅ **Branch Protection**: Main branch is protected with the following rules:
- **Force push protection**: Prevents force pushing to main branch
- **Deletion protection**: Prevents accidental deletion of main branch  
- **Pull request reviews**: Requires 1 approving review before merge
- **Dismiss stale reviews**: Automatically dismisses outdated reviews
- **Conversation resolution**: Requires all conversations to be resolved before merge
- **Status checks**: Ready for CI/CD status check requirements

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
# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. This cryptographic library handles sensitive cryptographic operations, making security reports critical for user safety.

### How to Report

**Please use GitHub's Private Vulnerability Reporting feature** for all security issues:

1. Go to the "Security" tab in this repository
2. Click "Report a vulnerability" 
3. Provide detailed information about the vulnerability

### What to Report

Please report any security issues including:

- **Cryptographic vulnerabilities**: Timing attacks, weak randomness, algorithm implementation flaws
- **Input validation bypasses**: Buffer overflows, injection attacks
- **Authentication/authorization issues**: Privilege escalation, access control bypasses  
- **Side-channel attacks**: Information leakage through timing, power, or other channels
- **Dependency vulnerabilities**: Issues in development dependencies that could affect builds

### Response Timeline

- **Initial response**: Within 48 hours
- **Vulnerability assessment**: Within 1 week
- **Fix timeline**: Critical issues patched within 2 weeks, others within 30 days
- **Public disclosure**: Coordinated after fix is released

### Scope

This policy covers:
- All cryptographic implementations in this repository
- Build and release infrastructure 
- Documentation that could lead to security misconfigurations

### Recognition

Security researchers who responsibly disclose vulnerabilities will be credited in release notes (with permission).

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                |

## Security Best Practices

When using this library:
- Always use the latest version
- Follow the security guidelines in documentation
- Never log or expose cryptographic keys or sensitive data
- Use secure random number generation for all cryptographic operations
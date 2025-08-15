# Data Masking for Sensitive Information

The fjell-logging package includes a powerful and configurable data masking system that automatically detects and masks sensitive information in log messages and data objects before they reach any output destinations.

## Overview

The masking system is designed to be:
- **Lightweight**: Zero performance impact when disabled
- **Configurable**: Granular control over what gets masked
- **Deterministic**: Consistent masking behavior across all environments
- **Safe**: Deep cloning to prevent mutation of original objects
- **Performant**: Efficient regex patterns and early exit strategies

## What Gets Masked

### Private Keys
- RSA Private Keys (`-----BEGIN RSA PRIVATE KEY-----`)
- EC Private Keys (`-----BEGIN EC PRIVATE KEY-----`)
- DSA Private Keys (`-----BEGIN DSA PRIVATE KEY-----`)
- Generic Private Keys (`-----BEGIN PRIVATE KEY-----`)

### Long Base64 Blobs
- Any continuous sequence of base64 characters (A-Z, a-z, 0-9, +, /, =) that is 200 characters or longer
- Useful for catching encoded binary data, certificates, and other large encoded content

### JWT Tokens
- JSON Web Tokens with segments longer than 100 characters
- Detects the three-part structure (header.payload.signature) and masks if middle or third segment is too long

### Email Addresses
- Standard email format detection (user@domain.com)
- Configurable on/off

### Social Security Numbers
- Both formatted (123-45-6789) and unformatted (123456789) SSNs
- Configurable on/off

## Configuration

The masking system is **disabled by default** and must be explicitly enabled. This ensures zero performance impact for users who don't need masking.

### Configuration Scope

**Global Configuration**: Masking is configured at the logging system level and applies to all loggers and log entries. There is currently no per-logger or per-area masking configuration - it's an all-or-nothing system-wide setting.

**Future Enhancement**: Per-area masking configuration may be added in future versions to allow different masking rules for different parts of your application.

### Basic Configuration

```typescript
import { configureLogging } from '@fjell/logging';

const config = {
  masking: {
    enabled: true,                    // Enable masking (default: false)
    maskEmails: true,                 // Mask email addresses (default: true)
    maskSSNs: true,                   // Mask SSNs (default: true)
    maskPrivateKeys: true,            // Mask private keys (default: true)
    maskBase64Blobs: true,            // Mask long base64 (default: true)
    maskJWTs: true,                   // Mask JWT tokens (default: true)
    maxDepth: 8                       // Max recursion depth (default: 8)
  }
};
```

### Environment Variable Configuration

```bash
# Enable masking with all defaults
export LOGGING_CONFIG='{"masking":{"enabled":true}}'

# Custom masking configuration
export LOGGING_CONFIG='{
  "masking": {
    "enabled": true,
    "maskEmails": false,
    "maskSSNs": true,
    "maskPrivateKeys": true,
    "maskBase64Blobs": true,
    "maskJWTs": true,
    "maxDepth": 10
  }
}'
```

## Performance Considerations

**⚠️ Important**: Enabling masking causes a performance penalty due to the computational overhead of regex pattern matching, object traversal, and deep cloning operations.

### Performance Impact When Enabled

Based on performance testing with realistic data:

- **String Masking**: ~3,400% overhead (34x slower than no masking)
  - Per-call cost: ~1.15 microseconds
  - Due to regex compilation and execution on sensitive data patterns

- **Object Masking**: ~960% overhead (9.6x slower than no masking)
  - Per-call cost: ~2.48 microseconds
  - Due to recursive object traversal and deep cloning

- **Middleware Masking**: ~1,190% overhead (11.9x slower than no masking)
  - Per-call cost: ~2.92 microseconds
  - Combines string and object masking overhead

### Performance When Disabled

- **Zero overhead**: No function calls, no regex compilation, no object traversal
- **Immediate return**: Functions return the input unchanged
- **Minimal function call cost**: ~0.14 microseconds when disabled (vs. no call at all)

### Performance Benchmarks

- **Small objects** (< 1KB): < 1ms
- **Medium objects** (1-100KB): 1-10ms
- **Large objects** (100KB-1MB): 10-100ms
- **Very large objects** (> 1MB): Linear scaling with size

### When to Enable Masking

**Enable masking when:**
- Logging in production environments
- Handling user data or PII
- Compliance requirements mandate data protection
- Security is a primary concern

**Consider disabling masking when:**
- Performance is critical and logs don't contain sensitive data
- Development/testing environments where data sensitivity is low
- High-throughput logging scenarios where overhead is unacceptable

### Performance Optimization Tips

1. **Enable only when needed**: Keep masking disabled in development unless testing the feature
2. **Use appropriate depth limits**: Set `maxDepth` to the minimum needed for your data structures
3. **Consider selective masking**: Disable specific masking rules you don't need
4. **Monitor performance**: Use the timing tests to measure impact in your specific environment
5. **Batch processing**: When possible, process multiple log entries together to amortize overhead

## Usage

### Direct Masking Functions

```typescript
import { maskString, maskObject, maskWithConfig } from '@fjell/logging';

// Mask a single string
const masked = maskString("user@example.com logged in");
// Result: "**** logged in"

// Mask an object
const data = {
  user: "admin@example.com",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
};
const maskedData = maskObject(data);
// Result: { user: "****", token: "****" }

// Mask with custom configuration
const config = { enabled: true, maskEmails: false, maskJWTs: true };
const customMasked = maskWithConfig(data, config);
// Result: { user: "admin@example.com", token: "****" }
```

### Middleware Integration

```typescript
import { createMaskingMiddleware } from '@fjell/logging';

// Create middleware with configuration
const maskingMiddleware = createMaskingMiddleware({
  enabled: true,
  maskEmails: true,
  maskSSNs: true
});

// Apply to log entries
const logEntry = {
  level: "info",
  message: "User user@example.com logged in",
  data: { ssn: "123-45-6789" }
};

const maskedEntry = maskingMiddleware(logEntry);
// Result: { level: "info", message: "User **** logged in", data: { ssn: "****" } }
```

### Batch Processing

```typescript
import { maskLogEntries } from '@fjell/logging';

const entries = [
  { message: "user@example.com logged in" },
  { message: "admin@example.com failed login" }
];

const maskedEntries = maskLogEntries(entries, { enabled: true });
// Result: [{ message: "**** logged in" }, { message: "**** failed login" }]
```

## Security Features

### Deterministic Masking
- Same input always produces same masked output
- No random masking that could leak information through timing

### Deep Cloning
- Original objects are never modified
- Prevents accidental data leakage through object references

### Recursion Protection
- Configurable maximum depth prevents stack overflow attacks
- Safe handling of circular references

### Comprehensive Coverage
- Covers all common sensitive data patterns
- Extensible for custom patterns if needed

## Examples

### Logging Sensitive Data

```typescript
import { getLogger } from '@fjell/logging';

const logger = getLogger();

// This will automatically mask sensitive data if masking is enabled
logger.info("User authentication", {
  user: "admin@example.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n-----END PRIVATE KEY-----",
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
});
```

### Custom Masking Rules

```typescript
// Create a custom masking configuration
const customMasking = {
  enabled: true,
  maskEmails: false,        // Don't mask emails
  maskSSNs: true,           // Do mask SSNs
  maskPrivateKeys: true,    // Do mask private keys
  maskBase64Blobs: false,   // Don't mask base64 blobs
  maskJWTs: true,           // Do mask JWTs
  maxDepth: 5               // Limit recursion depth
};

// Apply to specific data
const sensitiveData = {
  user: "admin@example.com",           // Won't be masked
  ssn: "123-45-6789",                 // Will be masked
  privateKey: "-----BEGIN PRIVATE KEY-----\n...", // Will be masked
  base64Data: "a".repeat(300),        // Won't be masked
  jwt: "header.payload.signature"     // Will be masked if segments are long
};

const masked = maskWithConfig(sensitiveData, customMasking);
```

## Best Practices

### 1. Enable Only When Needed
```typescript
// Good: Enable only in production or when needed
const config = {
  masking: {
    enabled: process.env.NODE_ENV === 'production',
    // ... other options
  }
};
```

### 2. Use Appropriate Depth Limits
```typescript
// Good: Set reasonable depth limits
const config = {
  masking: {
    enabled: true,
    maxDepth: 5  // Most nested objects don't go deeper than 5 levels
  }
};
```

### 3. Test Masking Behavior
```typescript
// Test that sensitive data is properly masked
const testData = "user@example.com 123-45-6789";
const masked = maskString(testData);
expect(masked).toBe("**** ****");
```

### 4. Monitor Performance
```typescript
// Measure masking performance in your environment
const start = performance.now();
const masked = maskObject(largeObject);
const duration = performance.now() - start;
console.log(`Masking took ${duration}ms`);
```

### 5. Consider Performance Impact
```typescript
// Be aware of the performance cost when enabling masking
// Consider if the security benefit outweighs the performance penalty
// Use the timing tests to measure impact in your specific environment
```

## Troubleshooting

### Masking Not Working
1. Check that `enabled: true` is set in configuration
2. Verify the masking configuration is being loaded correctly
3. Check environment variable format if using LOGGING_CONFIG

### Performance Issues
1. Reduce `maxDepth` if dealing with very deep objects
2. Consider disabling specific masking rules you don't need
3. Profile with smaller objects first
4. **Consider if masking is necessary** - the performance impact is significant

### False Positives
1. Adjust regex patterns if legitimate content is being masked
2. Use `maskWithConfig` with custom rules for specific use cases
3. Consider whitelisting known-safe patterns

## API Reference

### Functions

- `maskString(input: string): string` - Mask sensitive data in a string
- `maskObject<T>(obj: T, maxDepth?: number): T` - Mask sensitive data in an object
- `maskWithConfig<T>(input: T, config: MaskingConfig): T` - Mask with custom configuration

### Middleware

- `maskLogEntry(entry: LogEntry, config: MaskingConfig): LogEntry` - Mask a single log entry
- `createMaskingMiddleware(config: MaskingConfig)` - Create a reusable middleware function
- `maskLogEntries(entries: LogEntry[], config: MaskingConfig): LogEntry[]` - Mask multiple log entries

### Types

- `MaskingConfig` - Configuration interface for masking behavior
- `LogEntry` - Log entry structure for middleware processing

### Constants

- `defaultMaskingConfig` - Default masking configuration (disabled by default)

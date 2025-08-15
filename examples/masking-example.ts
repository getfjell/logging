/**
 * Example demonstrating the masking functionality
 * This shows how to use masking to protect sensitive data in logs
 */

import {
  MaskingConfig,
  maskObject,
  maskString,
  maskWithConfig
} from "../src/utils/maskSensitive";
import {
  createMaskingMiddleware
} from "../src/middleware/maskMiddleware";

// Example 1: Basic string masking
console.log("=== Basic String Masking ===");
const sensitiveMessage = "User admin@example.com logged in with SSN 123-45-6789";
const maskedMessage = maskString(sensitiveMessage);
console.log("Original:", sensitiveMessage);
console.log("Masked:", maskedMessage);
console.log();

// Example 2: Object masking
console.log("=== Object Masking ===");
const userData = {
  username: "john_doe",
  email: "john.doe@company.com",
  ssn: "987-65-4321",
  apiKey: "sk_live_1234567890abcdef1234567890abcdef12345678",
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
AgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----`,
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
};

const maskedData = maskObject(userData);
console.log("Original data:", JSON.stringify(userData, null, 2));
console.log("Masked data:", JSON.stringify(maskedData, null, 2));
console.log();

// Example 3: Custom configuration
console.log("=== Custom Configuration ===");
const customConfig: MaskingConfig = {
  enabled: true,
  maskEmails: false,        // Don't mask emails
  maskSSNs: true,           // Do mask SSNs
  maskPrivateKeys: true,    // Do mask private keys
  maskBase64Blobs: false,   // Don't mask base64 blobs
  maskJWTs: true,           // Do mask JWTs
  maxDepth: 5               // Limit recursion depth
};

const customMasked = maskWithConfig(userData, customConfig);
console.log("Custom masked (emails preserved):", JSON.stringify(customMasked, null, 2));
console.log();

// Example 4: Middleware usage
console.log("=== Middleware Usage ===");
const maskingMiddleware = createMaskingMiddleware({
  enabled: true,
  maskEmails: true,
  maskSSNs: true,
  maskPrivateKeys: true,
  maskBase64Blobs: true,
  maskJWTs: true,
  maxDepth: 8
});

const logEntry = {
  level: "info",
  message: "User admin@example.com authenticated successfully",
  timestamp: "2023-01-01T00:00:00Z",
  data: {
    userId: "12345",
    email: "admin@example.com",
    ssn: "111-22-3333"
  },
  meta: {
    requestId: "req_123",
    ipAddress: "192.168.1.100"
  }
};

const maskedEntry = maskingMiddleware(logEntry);
console.log("Original log entry:", JSON.stringify(logEntry, null, 2));
console.log("Masked log entry:", JSON.stringify(maskedEntry, null, 2));
console.log();

// Example 5: Performance demonstration
console.log("=== Performance Test ===");
const largeObject = {
  users: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    email: `user${i}@example.com`,
    ssn: `${100 + i}-${20 + i}-${3000 + i}`,
    data: "Some safe data that won't be masked"
  }))
};

const start = performance.now();
const maskedLarge = maskObject(largeObject);
const end = performance.now();

console.log(`Masked ${largeObject.users.length} user records in ${(end - start).toFixed(2)}ms`);
console.log(`First user email: ${maskedLarge.users[0].email}`);
console.log(`First user SSN: ${maskedLarge.users[0].ssn}`);
console.log();

// Example 6: Disabled masking (zero overhead)
console.log("=== Disabled Masking ===");
const disabledConfig: MaskingConfig = {
  enabled: false,
  maskEmails: true,
  maskSSNs: true,
  maskPrivateKeys: true,
  maskBase64Blobs: true,
  maskJWTs: true,
  maxDepth: 8
};

const startDisabled = performance.now();
const disabledMasked = maskWithConfig(userData, disabledConfig);
const endDisabled = performance.now();

console.log(`Disabled masking took ${(endDisabled - startDisabled).toFixed(4)}ms`);
console.log("Data unchanged:", JSON.stringify(disabledMasked, null, 2));
console.log();

console.log("=== Masking Example Complete ===");

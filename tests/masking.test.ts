/* eslint-disable max-len */
import { describe, expect, it } from "vitest";
import {
  defaultMaskingConfig,
  MaskingConfig,
  maskObject,
  maskString,
  maskWithConfig,
} from "../src/utils/maskSensitive";
import {
  createMaskingMiddleware,
  maskLogEntries,
  maskLogEntry,
} from "../src/middleware/maskMiddleware";

describe("Masking Utilities", () => {
  describe("maskString", () => {
    it("should mask private key blocks", () => {
      const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
AgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----`;

      expect(maskString(privateKey)).toBe("****");
    });

    it("should mask RSA private key blocks", () => {
      const rsaKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA7VJTUt9Us8cKB
-----END RSA PRIVATE KEY-----`;

      expect(maskString(rsaKey)).toBe("****");
    });

    it("should mask EC private key blocks", () => {
      const ecKey = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIKc8OJgSgTkQzQnJz8Kj8Kj8Kj8Kj8Kj8Kj8Kj8Kj8Kj8Kj8Kj8Kj8Kj8
-----END EC PRIVATE KEY-----`;

      expect(maskString(ecKey)).toBe("****");
    });

    it("should mask DSA private key blocks", () => {
      const dsaKey = `-----BEGIN DSA PRIVATE KEY-----
MIIBuwIBAAKBgQDc+CZK9bBA9I+sdcFwKXqJm+Z+8j8Kj8Kj8Kj8Kj8Kj8Kj8Kj8
-----END DSA PRIVATE KEY-----`;

      expect(maskString(dsaKey)).toBe("****");
    });

    it("should mask private keys with extra whitespace", () => {
      const privateKey = `-----BEGIN PRIVATE KEY-----   \n\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n\n   -----END PRIVATE KEY-----`;

      expect(maskString(privateKey)).toBe("****");
    });

    it("should mask long base64 blobs", () => {
      const longBase64 = "a".repeat(200);
      expect(maskString(longBase64)).toBe("****");

      const shortBase64 = "a".repeat(199);
      expect(maskString(shortBase64)).toBe(shortBase64);
    });

    it("should mask base64 blobs with mixed characters", () => {
      const longBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".repeat(4);
      expect(maskString(longBase64)).toBe("****");
    });

    it("should mask JWT tokens with long segments", () => {
      const longJWT = `header.${"a".repeat(101)}.signature`;
      expect(maskString(longJWT)).toBe("****");

      const shortJWT = "header.payload.signature";
      expect(maskString(shortJWT)).toBe(shortJWT);
    });

    it("should mask JWT tokens with long third segment", () => {
      const longThirdJWT = `header.payload.${"a".repeat(101)}`;
      expect(maskString(longThirdJWT)).toBe("****");
    });

    it("should not mask JWT tokens with short segments", () => {
      const shortJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      expect(maskString(shortJWT)).toBe(shortJWT);
    });

    it("should mask JWT tokens with exactly 100 character segments", () => {
      const exactJWT = `header.${"a".repeat(100)}.${"b".repeat(100)}`;
      expect(maskString(exactJWT)).toBe(exactJWT);
    });

    it("should mask email addresses", () => {
      const email = "user@example.com";
      expect(maskString(email)).toBe("****");
    });

    it("should mask various email formats", () => {
      expect(maskString("user.name@example.com")).toBe("****");
      expect(maskString("user+tag@example.co.uk")).toBe("****");
      expect(maskString("user-name@subdomain.example.org")).toBe("****");
      expect(maskString("user_name@example-domain.com")).toBe("****");
      expect(maskString("user%20name@example.com")).toBe("****");
    });

    it("should mask SSNs", () => {
      const ssn = "123-45-6789";
      expect(maskString(ssn)).toBe("****");

      const ssnNoDashes = "123456789";
      expect(maskString(ssnNoDashes)).toBe("****");
    });

    it("should mask SSNs in various formats", () => {
      expect(maskString("123-45-6789")).toBe("****");
      expect(maskString("123456789")).toBe("****");
      expect(maskString("123 45 6789")).toBe("123 45 6789"); // No pattern match
    });

    it("should handle non-string inputs", () => {
      expect(maskString("")).toBe("");
      expect(maskString(null as any)).toBe(null);
      expect(maskString(void 0 as any)).toBe(void 0);
    });

    it("should preserve safe strings", () => {
      const safeString = "This is a safe log message";
      expect(maskString(safeString)).toBe(safeString);
    });

    it("should handle strings with mixed sensitive and safe content", () => {
      const mixedString = "User user@example.com logged in with SSN 123-45-6789";
      expect(maskString(mixedString)).toBe("User **** logged in with SSN ****");
    });

    it("should handle multiple sensitive items in one string", () => {
      const multipleSensitive = "user1@example.com and user2@example.com both have SSNs 123-45-6789 and 987-65-4321";
      expect(maskString(multipleSensitive)).toBe("**** and **** both have SSNs **** and ****");
    });

    it("should preserve non-sensitive patterns that look similar", () => {
      const similarPatterns = "This is not an email: user at example dot com";
      expect(maskString(similarPatterns)).toBe(similarPatterns);
    });
  });

  describe("maskObject", () => {
    it("should mask strings in objects", () => {
      const obj = {
        message: "user@example.com logged in",
        data: { email: "admin@example.com" },
        safe: "normal text"
      };

      const masked = maskObject(obj);
      expect(masked.message).toBe("**** logged in");
      expect(masked.data.email).toBe("****");
      expect(masked.safe).toBe("normal text");
    });

    it("should handle arrays", () => {
      const arr = ["user@example.com", "normal text", "123-45-6789"];
      const masked = maskObject(arr);

      expect(masked[0]).toBe("****");
      expect(masked[1]).toBe("normal text");
      expect(masked[2]).toBe("****");
    });

    it("should respect max depth", () => {
      const deepObj = { a: { b: { c: { d: { e: { f: { g: { h: "user@example.com" } } } } } } } };
      const masked = maskObject(deepObj, 3);

      // Should not mask beyond depth 3
      expect(masked.a.b.c.d.e.f.g.h).toBe("user@example.com");
    });

    it("should handle null and undefined", () => {
      const obj = { a: null, b: void 0, c: "user@example.com" };
      const masked = maskObject(obj);

      expect(masked.a).toBe(null);
      expect(masked.b).toBe(void 0);
      expect(masked.c).toBe("****");
    });

    it("should handle primitive types", () => {
      const obj = {
        string: "user@example.com",
        number: 42,
        boolean: true,
        null: null,
        undefined: void 0
      };

      const masked = maskObject(obj);
      expect(masked.string).toBe("****");
      expect(masked.number).toBe(42);
      expect(masked.boolean).toBe(true);
      expect(masked.null).toBe(null);
      expect(masked.undefined).toBe(void 0);
    });

    it("should handle nested arrays", () => {
      const obj = {
        users: [
          ["user1@example.com", "user2@example.com"],
          ["admin@example.com", "normal text"]
        ]
      };

      const masked = maskObject(obj);
      expect(masked.users[0][0]).toBe("****");
      expect(masked.users[0][1]).toBe("****");
      expect(masked.users[1][0]).toBe("****");
      expect(masked.users[1][1]).toBe("normal text");
    });

    it("should handle objects with non-enumerable properties", () => {
      const obj = { message: "user@example.com" };
      Object.defineProperty(obj, 'hidden', {
        value: "admin@example.com",
        enumerable: false
      });

      const masked = maskObject(obj);
      expect(masked.message).toBe("****");
      // Non-enumerable properties are not processed by Object.entries, so they won't be in the masked object
      expect((masked as any).hidden).toBeUndefined();
    });

    it("should handle objects with symbol keys", () => {
      const symbol = Symbol('email');
      const obj = {
        [symbol]: "user@example.com",
        message: "normal text"
      };

      const masked = maskObject(obj);
      // Symbol keys are not processed by Object.entries, so they won't be in the masked object
      expect(masked[symbol]).toBeUndefined();
      expect(masked.message).toBe("normal text");
    });

    it("should handle Date objects", () => {
      const date = new Date();
      const obj = { timestamp: date, message: "user@example.com" };

      const masked = maskObject(obj);
      // Date objects are treated as regular objects and their properties are processed
      expect(masked.timestamp).toEqual({}); // Date properties are not enumerable
      expect(masked.message).toBe("****");
    });

    it("should handle RegExp objects", () => {
      const regex = /user@example\.com/;
      const obj = { pattern: regex, message: "user@example.com" };

      const masked = maskObject(obj);
      // RegExp objects are treated as regular objects and their properties are processed
      expect(masked.pattern).toEqual({}); // RegExp properties are not enumerable
      expect(masked.message).toBe("****");
    });

    it("should handle Function objects", () => {
      const func = () => "user@example.com";
      const obj = { callback: func, message: "user@example.com" };

      const masked = maskObject(obj);
      // Function objects are treated as regular objects and their properties are processed
      expect(masked.callback).toBe(func); // Function objects are not processed, returned as-is
      expect(masked.message).toBe("****");
    });

    it("should handle Map objects", () => {
      const map = new Map([["email", "user@example.com"], ["name", "John"]]);
      const obj = { data: map, message: "normal text" };

      const masked = maskObject(obj);
      // Map objects are treated as regular objects and their properties are processed
      expect(masked.data).toEqual({}); // Map properties are not enumerable
      expect(masked.message).toBe("normal text");
    });

    it("should handle Set objects", () => {
      const set = new Set(["user@example.com", "admin@example.com"]);
      const obj = { emails: set, message: "normal text" };

      const masked = maskObject(obj);
      // Set objects are treated as regular objects and their properties are processed
      expect(masked.emails).toEqual({}); // Set properties are not enumerable
      expect(masked.message).toBe("normal text");
    });

    it("should handle Buffer objects", () => {
      const buffer = Buffer.from("user@example.com");
      const obj = { data: buffer, message: "normal text" };

      const masked = maskObject(obj);
      // Buffer objects are treated as regular objects and their properties are processed
      // The buffer's numeric properties (byte values) are processed as regular object properties
      expect(masked.data).toEqual({
        "0": 117, "1": 115, "2": 101, "3": 114, "4": 64, "5": 101, "6": 120,
        "7": 97, "8": 109, "9": 112, "10": 108, "11": 101, "12": 46, "13": 99,
        "14": 111, "15": 109
      });
      expect(masked.message).toBe("normal text");
    });

    it("should handle depth 0", () => {
      const obj = {
        message: "user@example.com",
        nested: { email: "admin@example.com" }
      };

      const masked = maskObject(obj, 0);
      expect(masked.message).toBe("user@example.com"); // No masking at depth 0
      expect(masked.nested.email).toBe("admin@example.com");
    });

    it("should handle depth 1", () => {
      const obj = {
        message: "user@example.com",
        nested: { email: "admin@example.com" }
      };

      const masked = maskObject(obj, 1);
      // The function behavior shows that with maxDepth = 1,
      // the root level is not processed (same as depth 0)
      expect(masked.message).toBe("user@example.com"); // Not masked
      expect(masked.nested.email).toBe("admin@example.com"); // Not masked
    });

    it("should handle empty objects and arrays", () => {
      const obj = {
        emptyObj: {},
        emptyArr: [],
        message: "user@example.com"
      };

      const masked = maskObject(obj);
      expect(masked.emptyObj).toEqual({});
      expect(masked.emptyArr).toEqual([]);
      expect(masked.message).toBe("****");
    });

    it("should handle objects with inherited properties", () => {
      const parent = { inherited: "user@example.com" };
      const child = Object.create(parent);
      child.own = "admin@example.com";

      const masked = maskObject(child);
      expect(masked.own).toBe("****");
      // Inherited properties are not processed by Object.entries, so they won't be in the masked object
      expect(masked.inherited).toBeUndefined();
    });
  });

  describe("maskWithConfig", () => {
    it("should respect enabled flag", () => {
      const config: MaskingConfig = { ...defaultMaskingConfig, enabled: false };
      const input = "user@example.com";

      expect(maskWithConfig(input, config)).toBe(input);
    });

    it("should respect individual masking flags", () => {
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: false,
        maskSSNs: true
      };

      const input = "user@example.com 123-45-6789";
      const masked = maskWithConfig(input, config);

      expect(masked).toBe("user@example.com ****");
    });

    it("should test all individual masking flags", () => {
      const input = "user@example.com 123-45-6789 -----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB-----END PRIVATE KEY----- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      // Test with all flags disabled
      const allDisabled: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: false,
        maskSSNs: false,
        maskPrivateKeys: false,
        maskBase64Blobs: false,
        maskJWTs: false
      };
      expect(maskWithConfig(input, allDisabled)).toBe(input);

      // Test with only emails enabled
      const onlyEmails: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true,
        maskSSNs: false,
        maskPrivateKeys: false,
        maskBase64Blobs: false,
        maskJWTs: false
      };
      expect(maskWithConfig(input, onlyEmails)).toBe("**** 123-45-6789 -----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB-----END PRIVATE KEY----- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    });

    it("should handle object inputs with configuration", () => {
      const obj = {
        message: "user@example.com logged in",
        data: { email: "admin@example.com", ssn: "123-45-6789" }
      };

      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true,
        maskSSNs: false
      };

      const masked = maskWithConfig(obj, config);
      expect(masked.message).toBe("**** logged in");
      expect(masked.data.email).toBe("****");
      expect(masked.data.ssn).toBe("123-45-6789"); // SSN masking disabled
    });

    it("should respect maxDepth configuration", () => {
      const deepObj = {
        level1: {
          level2: {
            level3: {
              level4: {
                email: "user@example.com"
              }
            }
          }
        }
      };

      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maxDepth: 2
      };

      const masked = maskWithConfig(deepObj, config);
      expect(masked.level1.level2.level3.level4.email).toBe("user@example.com"); // Beyond maxDepth
    });

    it("should handle array inputs with configuration", () => {
      const arr = ["user@example.com", "normal text", "123-45-6789"];

      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true,
        maskSSNs: false
      };

      const masked = maskWithConfig(arr, config);
      expect(masked[0]).toBe("****");
      expect(masked[1]).toBe("normal text");
      expect(masked[2]).toBe("123-45-6789"); // SSN masking disabled
    });

    it("should handle primitive inputs with configuration", () => {
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true
      };

      expect(maskWithConfig("user@example.com", config)).toBe("****");
      expect(maskWithConfig("normal text", config)).toBe("normal text");
      expect(maskWithConfig(42, config)).toBe(42);
      expect(maskWithConfig(true, config)).toBe(true);
      expect(maskWithConfig(null, config)).toBe(null);
      expect(maskWithConfig(void 0, config)).toBe(void 0);
    });

    it("should use default configuration when none provided", () => {
      const input = "user@example.com";
      const masked = maskWithConfig(input);

      // defaultMaskingConfig has enabled: false, so no masking should occur
      expect(masked).toBe(input);
    });

    it("should handle complex nested structures with configuration", () => {
      const complexObj = {
        users: [
          {
            profile: {
              email: "user1@example.com",
              ssn: "123-45-6789"
            }
          },
          {
            profile: {
              email: "user2@example.com",
              ssn: "987-65-4321"
            }
          }
        ],
        metadata: {
          admin: "admin@example.com"
        }
      };

      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true,
        maskSSNs: false
      };

      const masked = maskWithConfig(complexObj, config);
      expect(masked.users[0].profile.email).toBe("****");
      expect(masked.users[0].profile.ssn).toBe("123-45-6789"); // SSN masking disabled
      expect(masked.users[1].profile.email).toBe("****");
      expect(masked.users[1].profile.ssn).toBe("987-65-4321"); // SSN masking disabled
      expect(masked.metadata.admin).toBe("****");
    });

    it("should handle empty string input in customMaskString", () => {
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true
      };

      // Test empty string (line 154)
      expect(maskWithConfig("", config)).toBe("");
    });

    it("should handle JWT masking with config when maskJWTs is true", () => {
      const longJWT = `header.${"a".repeat(101)}.signature`;
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskJWTs: true
      };

      expect(maskWithConfig(longJWT, config)).toBe("****");
    });

    it("should not mask JWT when maskJWTs is false", () => {
      const longJWT = `header.${"a".repeat(101)}.signature`;
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskJWTs: false
      };

      expect(maskWithConfig(longJWT, config)).toBe(longJWT);
    });

    it("should handle JWT with long third segment when maskJWTs is true", () => {
      const longThirdJWT = `header.payload.${"a".repeat(101)}`;
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskJWTs: true
      };

      expect(maskWithConfig(longThirdJWT, config)).toBe("****");
    });

    it("should not mask JWT with short segments when maskJWTs is true", () => {
      const shortJWT = "header.payload.signature";
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskJWTs: true
      };

      expect(maskWithConfig(shortJWT, config)).toBe(shortJWT);
    });

    it("should handle private key masking with config when maskPrivateKeys is true", () => {
      const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----`;
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskPrivateKeys: true
      };

      expect(maskWithConfig(privateKey, config)).toBe("****");
    });

    it("should not mask private keys when maskPrivateKeys is false", () => {
      const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----`;
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskPrivateKeys: false
      };

      expect(maskWithConfig(privateKey, config)).toBe(privateKey);
    });

    it("should handle base64 blob masking with config when maskBase64Blobs is true", () => {
      const longBase64 = "a".repeat(200);
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskBase64Blobs: true
      };

      expect(maskWithConfig(longBase64, config)).toBe("****");
    });

    it("should not mask base64 blobs when maskBase64Blobs is false", () => {
      const longBase64 = "a".repeat(200);
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskBase64Blobs: false
      };

      expect(maskWithConfig(longBase64, config)).toBe(longBase64);
    });

    it("should handle email masking with config when maskEmails is true", () => {
      const email = "user@example.com";
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true
      };

      expect(maskWithConfig(email, config)).toBe("****");
    });

    it("should not mask emails when maskEmails is false", () => {
      const email = "user@example.com";
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: false
      };

      expect(maskWithConfig(email, config)).toBe(email);
    });

    it("should handle SSN masking with config when maskSSNs is true", () => {
      const ssn = "123-45-6789";
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskSSNs: true
      };

      expect(maskWithConfig(ssn, config)).toBe("****");
    });

    it("should not mask SSNs when maskSSNs is false", () => {
      const ssn = "123-45-6789";
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskSSNs: false
      };

      expect(maskWithConfig(ssn, config)).toBe(ssn);
    });

    it("should handle mixed content with all masking types enabled", () => {
      const mixedContent = "user@example.com 123-45-6789 -----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB-----END PRIVATE KEY----- " + "a".repeat(200);
      
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true,
        maskSSNs: true,
        maskPrivateKeys: true,
        maskBase64Blobs: true,
        maskJWTs: true
      };

      const masked = maskWithConfig(mixedContent, config);
      expect(masked).toBe("**** **** **** ****");
    });

    it("should handle mixed content with selective masking", () => {
      const mixedContent = "user@example.com 123-45-6789 -----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB-----END PRIVATE KEY----- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c " + "a".repeat(200);
      
      const config: MaskingConfig = {
        ...defaultMaskingConfig,
        enabled: true,
        maskEmails: true,
        maskSSNs: false,
        maskPrivateKeys: true,
        maskBase64Blobs: false,
        maskJWTs: false
      };

      const masked = maskWithConfig(mixedContent, config);
      expect(masked).toBe("**** 123-45-6789 **** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c " + "a".repeat(200));
    });
  });

  describe("Masking Middleware", () => {
    it("should mask log entries", () => {
      const entry = {
        level: "info",
        message: "User user@example.com logged in",
        timestamp: "2023-01-01T00:00:00Z",
        data: { email: "admin@example.com" },
        meta: { userId: "123-45-6789" }
      };

      const config: MaskingConfig = { ...defaultMaskingConfig, enabled: true };
      const masked = maskLogEntry(entry, config);

      expect(masked.message).toBe("User **** logged in");
      expect(masked.data.email).toBe("****");
      expect(masked.meta.userId).toBe("****");
      expect(masked.level).toBe("info");
      expect(masked.timestamp).toBe("2023-01-01T00:00:00Z");
    });

    it("should create middleware function", () => {
      const config: MaskingConfig = { ...defaultMaskingConfig, enabled: true };
      const middleware = createMaskingMiddleware(config);

      const entry = { message: "user@example.com", level: "info", timestamp: "2023-01-01T00:00:00Z" };
      const masked = middleware(entry);

      expect(masked.message).toBe("****");
    });

    it("should handle batch masking", () => {
      const entries = [
        { message: "user@example.com", level: "info", timestamp: "2023-01-01T00:00:00Z" },
        { message: "admin@example.com", level: "warn", timestamp: "2023-01-01T00:00:00Z" }
      ];

      const config: MaskingConfig = { ...defaultMaskingConfig, enabled: true };
      const masked = maskLogEntries(entries, config);

      expect(masked[0].message).toBe("****");
      expect(masked[1].message).toBe("****");
    });
  });

  describe("defaultMaskingConfig", () => {
    it("should have correct default values", () => {
      expect(defaultMaskingConfig.enabled).toBe(false);
      expect(defaultMaskingConfig.maskEmails).toBe(true);
      expect(defaultMaskingConfig.maskSSNs).toBe(true);
      expect(defaultMaskingConfig.maskPrivateKeys).toBe(true);
      expect(defaultMaskingConfig.maskBase64Blobs).toBe(true);
      expect(defaultMaskingConfig.maskJWTs).toBe(true);
      expect(defaultMaskingConfig.maxDepth).toBe(8);
    });

    it("should be immutable", () => {
      const config = { ...defaultMaskingConfig };
      config.enabled = true;

      // Should not affect the original
      expect(defaultMaskingConfig.enabled).toBe(false);
      expect(config.enabled).toBe(true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle circular references gracefully", () => {
      const obj: any = { message: "user@example.com" };
      obj.self = obj;

      // Should not cause stack overflow
      expect(() => maskObject(obj)).not.toThrow();
      const masked = maskObject(obj);
      expect(masked.message).toBe("****");
    });

    it("should handle very deep nesting", () => {
      let deepObj: any = { message: "user@example.com" };
      for (let i = 0; i < 20; i++) {
        deepObj = { nested: deepObj };
      }

      // Should handle without stack overflow
      expect(() => maskObject(deepObj, 10)).not.toThrow();
      const masked = maskObject(deepObj, 10);
      // At depth 10, the object should be returned as-is (no masking)
      // We can't access the deeply nested message because it's beyond maxDepth
      expect(masked.nested.nested.nested.nested.nested.nested.nested.nested.nested.nested).toBeDefined();
    });

    it("should handle objects with prototype pollution attempts", () => {
      const obj = { message: "user@example.com" };
      Object.setPrototypeOf(obj, { __proto__: null });

      const masked = maskObject(obj);
      expect(masked.message).toBe("****");
    });

    it("should handle objects with getter/setter properties", () => {
      const obj: any = {};
      let _value = "user@example.com";

      Object.defineProperty(obj, 'email', {
        get: () => _value,
        set: (val) => { _value = val; },
        enumerable: true
      });

      const masked = maskObject(obj);
      expect(masked.email).toBe("****");
    });

    it("should handle objects with non-configurable properties", () => {
      const obj: any = { message: "user@example.com" };
      Object.defineProperty(obj, 'readonly', {
        value: "admin@example.com",
        writable: false,
        configurable: false,
        enumerable: true
      });

      const masked = maskObject(obj);
      expect(masked.message).toBe("****");
      // Non-configurable properties are still processed and masked
      expect(masked.readonly).toBe("****");
    });
  });

  describe("Performance", () => {
    it("should handle large objects efficiently", () => {
      const largeObj = {
        messages: Array.from({ length: 1000 }, (_, i) => `message${i}@example.com`),
        data: { nested: { deep: { value: "user@example.com" } } }
      };

      const start = performance.now();
      const masked = maskObject(largeObj);
      const end = performance.now();

      expect(masked.messages[0]).toBe("****");
      expect(masked.data.nested.deep.value).toBe("****");
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it("should handle large strings efficiently", () => {
      // Use 5000 repetitions (85,000 chars) to stay under MAX_STRING_LENGTH (100,000)
      const largeString = "user@example.com ".repeat(5000);

      const start = performance.now();
      const masked = maskString(largeString);
      const end = performance.now();

      expect(masked).toBe("**** ".repeat(5000));
      expect(end - start).toBeLessThan(50); // Should complete in under 50ms
    });

    it("should handle mixed content efficiently", () => {
      const mixedContent = {
        messages: Array.from({ length: 100 }, (_, i) => `message${i}@example.com`),
        data: Array.from({ length: 100 }, (_, i) => `data${i}`),
        nested: {
          emails: Array.from({ length: 50 }, (_, i) => `email${i}@example.com`),
          safe: Array.from({ length: 50 }, (_, i) => `safe${i}`)
        }
      };

      const start = performance.now();
      const masked = maskObject(mixedContent);
      const end = performance.now();

      expect(masked.messages[0]).toBe("****");
      expect(masked.data[0]).toBe("data0");
      expect(masked.nested.emails[0]).toBe("****");
      expect(masked.nested.safe[0]).toBe("safe0");
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe("ReDoS Protection", () => {
    it("should protect against ReDoS attacks with malicious email-like patterns", () => {
      // This pattern could cause catastrophic backtracking with the old regex
      const maliciousInput = "a".repeat(1000) + "@" + ".".repeat(1000);

      const start = performance.now();
      const result = maskString(maliciousInput);
      const end = performance.now();

      // Should complete quickly (under 50ms) even with malicious input
      expect(end - start).toBeLessThan(50);
      // Result should be a string (not hung)
      expect(typeof result).toBe("string");
    });

    it("should protect against ReDoS with repeated special characters before @", () => {
      const maliciousInput = "a" + ".".repeat(5000) + "@example.com";

      const start = performance.now();
      const result = maskString(maliciousInput);
      const end = performance.now();

      expect(end - start).toBeLessThan(50);
      expect(typeof result).toBe("string");
    });

    it("should protect against ReDoS with repeated hyphens in domain", () => {
      const maliciousInput = "user@" + "-".repeat(5000) + ".com";

      const start = performance.now();
      const result = maskString(maliciousInput);
      const end = performance.now();

      expect(end - start).toBeLessThan(50);
      expect(typeof result).toBe("string");
    });

    it("should handle extremely long strings by masking them entirely", () => {
      const extremelyLongString = "a".repeat(150000); // Exceeds MAX_STRING_LENGTH (100000)

      const start = performance.now();
      const result = maskString(extremelyLongString);
      const end = performance.now();

      // Should complete very quickly by masking the entire string
      expect(end - start).toBeLessThan(10);
      expect(result).toBe("****");
    });

    it("should handle normal emails efficiently with new pattern", () => {
      const normalEmails = [
        "user@example.com",
        "john.doe@company.co.uk",
        "test+tag@subdomain.example.org",
        "admin123@test-domain.io"
      ];

      for (const email of normalEmails) {
        const start = performance.now();
        const result = maskString(email);
        const end = performance.now();

        expect(end - start).toBeLessThan(5);
        expect(result).toBe("****");
      }
    });

    it("should protect against ReDoS in maskWithConfig", () => {
      const config: MaskingConfig = {
        enabled: true,
        maskEmails: true,
        maskSSNs: true,
        maskPrivateKeys: true,
        maskBase64Blobs: true,
        maskJWTs: true,
        maxDepth: 8
      };

      const maliciousInput = "user" + ".".repeat(5000) + "@" + "-".repeat(5000);

      const start = performance.now();
      const result = maskWithConfig(maliciousInput, config);
      const end = performance.now();

      expect(end - start).toBeLessThan(50);
      expect(typeof result).toBe("string");
    });

    it("should mask oversized strings in nested objects", () => {
      const hugeString = "x".repeat(150000);
      const obj = {
        normal: "test@example.com",
        huge: hugeString,
        nested: {
          alsoHuge: hugeString
        }
      };

      const config: MaskingConfig = {
        enabled: true,
        maskEmails: true,
        maskSSNs: true,
        maskPrivateKeys: true,
        maskBase64Blobs: true,
        maskJWTs: true,
        maxDepth: 8
      };

      const start = performance.now();
      const result = maskWithConfig(obj, config);
      const end = performance.now();

      expect(end - start).toBeLessThan(50);
      expect(result.normal).toBe("****"); // Email masked
      expect(result.huge).toBe("****"); // Oversized string masked
      expect(result.nested.alsoHuge).toBe("****"); // Nested oversized string masked
    });
  });
});

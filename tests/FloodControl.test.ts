import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloodControl, FloodControlConfig, hash } from '../src/FloodControl';

describe('FloodControl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const config: FloodControlConfig = {
    enabled: true,
    threshold: 3,
    timeframe: 1000,
  };

  describe('hash function', () => {
    it('should create consistent hashes for identical inputs', () => {
      const hash1 = hash('test message', ['data1', 'data2']);
      const hash2 = hash('test message', ['data1', 'data2']);
      expect(hash1).toBe(hash2);
    });

    it('should create different hashes for different messages', () => {
      const hash1 = hash('message 1', ['data']);
      const hash2 = hash('message 2', ['data']);
      expect(hash1).not.toBe(hash2);
    });

    it('should create different hashes for different data', () => {
      const hash1 = hash('message', ['data1']);
      const hash2 = hash('message', ['data2']);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty data array', () => {
      const hash1 = hash('message', []);
      const hash2 = hash('message', []);
      expect(hash1).toBe(hash2);
    });

    it('should handle complex data types', () => {
      const obj = { key: 'value', nested: { num: 42 } };
      const arr = [1, 2, 3];
      const hash1 = hash('message', [obj, arr, 'string', 123, true, null]);
      const hash2 = hash('message', [obj, arr, 'string', 123, true, null]);
      expect(hash1).toBe(hash2);
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Should not throw
      expect(() => hash('message', [circular])).not.toThrow();

      // Should produce consistent hash
      const hash1 = hash('message', [circular]);
      const hash2 = hash('message', [circular]);
      expect(hash1).toBe(hash2);
    });

    it('should handle functions and undefined gracefully', () => {
      const fn = () => 'test';
      const undef = void 0;

      expect(() => hash('message', [fn, undef])).not.toThrow();

      const hash1 = hash('message', [fn, undef]);
      const hash2 = hash('message', [fn, undef]);
      expect(hash1).toBe(hash2);
    });

    it('should handle JSON.stringify errors gracefully', () => {
      // Create an object that will cause JSON.stringify to fail
      const problematicObj = {};
      Object.defineProperty(problematicObj, 'toJSON', {
        get: () => {
          throw new Error('JSON serialization failed');
        },
        configurable: true
      });

      // Verify that JSON.stringify actually fails for this object
      expect(() => JSON.stringify(problematicObj)).toThrow('JSON serialization failed');

      // But hash should handle it gracefully
      expect(() => hash('message', [problematicObj])).not.toThrow();

      const hash1 = hash('message', [problematicObj]);
      const hash2 = hash('message', [problematicObj]);
      expect(hash1).toBe(hash2);
    });

    it('should handle JSON.stringify errors with circular references', () => {
      // Create an object with a circular reference that will cause JSON.stringify to fail
      const circular: any = { name: 'test' };
      circular.self = circular;

      // This should trigger the catch block in the hash function
      expect(() => hash('message', [circular])).not.toThrow();

      const hash1 = hash('message', [circular]);
      const hash2 = hash('message', [circular]);
      expect(hash1).toBe(hash2);
    });

    it('should handle JSON.stringify errors with problematic properties', () => {
      // Create an object with a property that throws when accessed
      const problematicObj = {};
      Object.defineProperty(problematicObj, 'problematic', {
        get: () => {
          throw new Error('Property access failed');
        },
        configurable: true
      });

      // This should trigger the catch block in the hash function
      expect(() => hash('message', [problematicObj])).not.toThrow();

      const hash1 = hash('message', [problematicObj]);
      const hash2 = hash('message', [problematicObj]);
      expect(hash1).toBe(hash2);
    });

    it('should handle JSON.stringify errors with BigInt', () => {
      // BigInt cannot be serialized by JSON.stringify and should trigger the catch block
      const bigIntValue = BigInt(123);

      // Verify that JSON.stringify fails for BigInt
      expect(() => JSON.stringify(bigIntValue)).toThrow();

      // But hash should handle it gracefully
      expect(() => hash('message', [bigIntValue])).not.toThrow();

      const hash1 = hash('message', [bigIntValue]);
      const hash2 = hash('message', [bigIntValue]);
      expect(hash1).toBe(hash2);
    });
  });

  describe('constructor', () => {
    it('should create instance with correct config', () => {
      const floodControl = new FloodControl(config);
      expect(floodControl).toBeInstanceOf(FloodControl);
    });

    it('should not create cleanup timer when disabled', () => {
      const disabledConfig = { ...config, enabled: false };
      const floodControl = new FloodControl(disabledConfig);

      // Should not have created any timers
      expect(vi.getTimerCount()).toBe(0);

      // Clean up to avoid memory leaks in tests
      floodControl.destroy();
    });

    it('should create cleanup timer when enabled', () => {
      const floodControl = new FloodControl(config);

      // Should have created cleanup timer
      expect(vi.getTimerCount()).toBe(1);

      // Clean up to avoid memory leaks in tests
      floodControl.destroy();
    });
  });

  describe('check method', () => {
    it('should not suppress logs if disabled', () => {
      const floodControl = new FloodControl({ ...config, enabled: false });
      expect(floodControl.check('test message', [])).toBe('log');
      expect(floodControl.check('test message', [])).toBe('log');
      expect(floodControl.check('test message', [])).toBe('log');
      expect(floodControl.check('test message', [])).toBe('log');
    });

    it('should log messages below the threshold', () => {
      const floodControl = new FloodControl(config);
      expect(floodControl.check('test message', [])).toBe('log');
      expect(floodControl.check('test message', [])).toBe('log');
      expect(floodControl.check('test message', [])).toBe('log');
    });

    it('should suppress messages exceeding the threshold', () => {
      const floodControl = new FloodControl(config);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      expect(floodControl.check('test message', [])).toBe('suppress');
    });

    it('should resume logging after the timeframe has passed', () => {
      const floodControl = new FloodControl(config);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      expect(floodControl.check('test message', [])).toBe('suppress');

      vi.advanceTimersByTime(config.timeframe);

      expect(floodControl.check('test message', [])).toBe('resume');
    });

    it('should handle different messages independently', () => {
      const floodControl = new FloodControl(config);
      expect(floodControl.check('message 1', [])).toBe('log');
      expect(floodControl.check('message 2', [])).toBe('log');
      expect(floodControl.check('message 1', [])).toBe('log');
      expect(floodControl.check('message 2', [])).toBe('log');
      expect(floodControl.check('message 1', [])).toBe('log');
      expect(floodControl.check('message 2', [])).toBe('log');
      expect(floodControl.check('message 1', [])).toBe('suppress');
      expect(floodControl.check('message 2', [])).toBe('suppress');
    });

    it('should resume logging for a message and return resume', () => {
      const floodControl = new FloodControl(config);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      expect(floodControl.check('test message', [])).toBe('suppress');

      vi.advanceTimersByTime(config.timeframe);

      expect(floodControl.check('test message', [])).toBe('resume');
    });

    it('should increment suppressed count for repeated suppressed messages', () => {
      const floodControl = new FloodControl(config);

      // Exceed threshold
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      expect(floodControl.check('test message', [])).toBe('suppress');

      // Continue sending - should still be suppressed
      expect(floodControl.check('test message', [])).toBe('suppress');
      expect(floodControl.check('test message', [])).toBe('suppress');

      // Check suppressed count
      expect(floodControl.getSuppressedCount('test message', [])).toBe(3);
    });

    it('should handle messages with different data arrays', () => {
      const floodControl = new FloodControl(config);

      // Same message, different data
      expect(floodControl.check('message', ['data1'])).toBe('log');
      expect(floodControl.check('message', ['data2'])).toBe('log');
      expect(floodControl.check('message', ['data1'])).toBe('log');
      expect(floodControl.check('message', ['data2'])).toBe('log');
      expect(floodControl.check('message', ['data1'])).toBe('log');
      expect(floodControl.check('message', ['data2'])).toBe('log');

      // Should not be suppressed yet
      expect(floodControl.check('message', ['data1'])).toBe('suppress');
      expect(floodControl.check('message', ['data2'])).toBe('suppress');
    });

    it('should handle threshold of 1', () => {
      const singleThresholdConfig = { ...config, threshold: 1 };
      const floodControl = new FloodControl(singleThresholdConfig);

      expect(floodControl.check('test message', [])).toBe('log');
      expect(floodControl.check('test message', [])).toBe('suppress');
    });

    it('should handle very short timeframes', () => {
      const shortTimeframeConfig = { ...config, timeframe: 10 };
      const floodControl = new FloodControl(shortTimeframeConfig);

      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      expect(floodControl.check('test message', [])).toBe('suppress');

      // Advance time slightly less than timeframe
      vi.advanceTimersByTime(9);
      expect(floodControl.check('test message', [])).toBe('suppress');

      // Advance time past timeframe
      vi.advanceTimersByTime(2);
      expect(floodControl.check('test message', [])).toBe('resume');
    });
  });

  describe('getSuppressedCount method', () => {
    it('should return 0 for new messages', () => {
      const floodControl = new FloodControl(config);
      expect(floodControl.getSuppressedCount('new message', [])).toBe(0);
    });

    it('should return correct count for suppressed messages', () => {
      const floodControl = new FloodControl(config);

      // Exceed threshold
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []); // This triggers suppress

      expect(floodControl.getSuppressedCount('test message', [])).toBe(1);

      // Continue sending
      floodControl.check('test message', []);
      floodControl.check('test message', []);

      expect(floodControl.getSuppressedCount('test message', [])).toBe(3);
    });

    it('should return 0 after resuming', () => {
      const floodControl = new FloodControl(config);

      // Exceed threshold
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);

      expect(floodControl.getSuppressedCount('test message', [])).toBe(1);

      // Wait for timeframe to pass
      vi.advanceTimersByTime(config.timeframe);

      // Should resume
      expect(floodControl.check('test message', [])).toBe('resume');
      expect(floodControl.getSuppressedCount('test message', [])).toBe(0);
    });

    it('should handle different data arrays correctly', () => {
      const floodControl = new FloodControl(config);

      // Exceed threshold for message with data1
      floodControl.check('message', ['data1']);
      floodControl.check('message', ['data1']);
      floodControl.check('message', ['data1']);
      floodControl.check('message', ['data1']);

      expect(floodControl.getSuppressedCount('message', ['data1'])).toBe(1);
      expect(floodControl.getSuppressedCount('message', ['data2'])).toBe(0);
    });
  });

  describe('cleanup method', () => {
    it('should clean up old timestamps after timeframe', () => {
      const floodControl = new FloodControl(config);

      // Send messages to create history
      floodControl.check('message1', []);
      floodControl.check('message2', []);

      // Advance time past cleanup interval
      vi.advanceTimersByTime(config.timeframe * 3);

      // Should trigger cleanup
      vi.runOnlyPendingTimers();

      // Messages should be cleaned up
      expect(floodControl.getSuppressedCount('message1', [])).toBe(0);
      expect(floodControl.getSuppressedCount('message2', [])).toBe(0);
    });

    it('should preserve recent timestamps during cleanup', () => {
      const floodControl = new FloodControl(config);

      // Send messages
      floodControl.check('message1', []);
      floodControl.check('message2', []);

      // Advance time slightly less than timeframe
      vi.advanceTimersByTime(config.timeframe - 100);

      // Send another message
      floodControl.check('message1', []);

      // Advance time to trigger cleanup
      vi.advanceTimersByTime(config.timeframe * 2);
      vi.runOnlyPendingTimers();

      // message1 should still have recent timestamps
      expect(floodControl.check('message1', [])).toBe('log');
      expect(floodControl.check('message1', [])).toBe('log');
      expect(floodControl.check('message1', [])).toBe('log');
      expect(floodControl.check('message1', [])).toBe('suppress');
    });
  });

  describe('destroy method', () => {
    it('should clear cleanup timer', () => {
      const floodControl = new FloodControl(config);

      // Should have timer
      expect(vi.getTimerCount()).toBe(1);

      floodControl.destroy();

      // Should have no timers
      expect(vi.getTimerCount()).toBe(0);
    });

    it('should handle multiple destroy calls gracefully', () => {
      const floodControl = new FloodControl(config);

      floodControl.destroy();
      expect(() => floodControl.destroy()).not.toThrow();
    });

    it('should not throw when destroying disabled instance', () => {
      const disabledConfig = { ...config, enabled: false };
      const floodControl = new FloodControl(disabledConfig);

      expect(() => floodControl.destroy()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very large threshold values', () => {
      const largeThresholdConfig = { ...config, threshold: 1000 };
      const floodControl = new FloodControl(largeThresholdConfig);

      // Send many messages
      for (let i = 0; i < 999; i++) {
        expect(floodControl.check('test message', [])).toBe('log');
      }

      // 1000th message should still be logged (threshold not exceeded yet)
      expect(floodControl.check('test message', [])).toBe('log');

      // 1001st message should trigger suppress
      expect(floodControl.check('test message', [])).toBe('suppress');

      // Clean up
      floodControl.destroy();
    });

    it('should handle very long timeframes', () => {
      const longTimeframeConfig = { ...config, timeframe: 86400000 }; // 24 hours
      const floodControl = new FloodControl(longTimeframeConfig);

      floodControl.check('test message', []);
      floodControl.check('test message', []);
      floodControl.check('test message', []);
      expect(floodControl.check('test message', [])).toBe('suppress');

      // Advance time by 12 hours
      vi.advanceTimersByTime(43200000);

      // Should still be suppressed
      expect(floodControl.check('test message', [])).toBe('suppress');

      // Advance time past 24 hours
      vi.advanceTimersByTime(43200000);

      // Should resume
      expect(floodControl.check('test message', [])).toBe('resume');
    });

    it('should handle concurrent messages with same hash', () => {
      const floodControl = new FloodControl(config);

      // Simulate concurrent messages with same timestamp
      const now = Date.now();
      vi.setSystemTime(now);

      floodControl.check('message', ['data']);
      floodControl.check('message', ['data']);
      floodControl.check('message', ['data']);

      // Should suppress
      expect(floodControl.check('message', ['data'])).toBe('suppress');

      // Advance time slightly
      vi.setSystemTime(now + 100);
      expect(floodControl.check('message', ['data'])).toBe('suppress');

      // Advance time past timeframe
      vi.setSystemTime(now + config.timeframe + 100);
      expect(floodControl.check('message', ['data'])).toBe('resume');
    });
  });
});

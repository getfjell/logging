import { afterEach, describe, expect, it } from 'vitest';
import { performance } from 'perf_hooks';
import { FloodControl, FloodControlConfig } from '../src/FloodControl';

const sleep = (ms: number) => {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    //
  }
};

describe('FloodControl Timing', () => {
  const floodControls: FloodControl[] = [];

  afterEach(() => {
    floodControls.forEach(fc => fc.destroy());
    floodControls.length = 0;
  });

  it('should measure the performance overhead of FloodControl', () => {
    const messageCount = 5000;
    const messages = Array.from({ length: messageCount }, (_, i) => `Test message ${i % 10}`);

    // --- Test with FloodControl disabled ---
    const disabledConfig: FloodControlConfig = {
      enabled: false,
      threshold: 10,
      timeframe: 1000,
    };
    const floodControlDisabled = new FloodControl(disabledConfig);
    floodControls.push(floodControlDisabled);

    const startDisabled = performance.now();
    for (let i = 0; i < messageCount; i++) {
      floodControlDisabled.check(messages[i], []);
      sleep(1);
    }
    const endDisabled = performance.now();
    const durationDisabled = endDisabled - startDisabled;
    console.log(`Execution time with FloodControl disabled: ${durationDisabled.toFixed(2)}ms for ${messageCount} messages.`);

    // --- Test with FloodControl enabled ---
    const enabledConfig: FloodControlConfig = {
      enabled: true,
      threshold: 10,
      timeframe: 1000,
    };
    const floodControlEnabled = new FloodControl(enabledConfig);
    floodControls.push(floodControlEnabled);

    const startEnabled = performance.now();
    for (let i = 0; i < messageCount; i++) {
      floodControlEnabled.check(messages[i], []);
      sleep(1);
    }
    const endEnabled = performance.now();
    const durationEnabled = endEnabled - startEnabled;
    console.log(`Execution time with FloodControl enabled: ${durationEnabled.toFixed(2)}ms for ${messageCount} messages.`);

    console.log(`Total time with FloodControl disabled: ${durationDisabled.toFixed(2)}ms`);
    console.log(`Total time with FloodControl enabled: ${durationEnabled.toFixed(2)}ms`);

    console.log(`Overhead per call: ${((durationEnabled - durationDisabled) / messageCount * 1000).toFixed(4)} microseconds.`);
    const overheadPercentage = ((durationEnabled - durationDisabled) / durationDisabled) * 100;
    console.log(`Overhead percentage: ${overheadPercentage.toFixed(2)}%`);

    expect(overheadPercentage).toBeLessThan(2);
    expect(durationEnabled).toBeGreaterThan(durationDisabled);
  });
});
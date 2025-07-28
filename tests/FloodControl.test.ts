import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloodControl, FloodControlConfig } from '../src/FloodControl';

describe('FloodControl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const config: FloodControlConfig = {
    enabled: true,
    threshold: 3,
    timeframe: 1000,
  };

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
});
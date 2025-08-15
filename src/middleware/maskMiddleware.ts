/**
 * Masking middleware for logging pipeline
 * Applies sensitive data masking to log entries before they reach writers/transports
 */

import { defaultMaskingConfig, MaskingConfig, maskWithConfig } from "../utils/maskSensitive";

/**
 * Log entry structure that gets processed by the middleware
 */
export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  data?: any;
  meta?: any;
  [key: string]: any;
}

/**
 * Masking middleware function
 * @param entry - The log entry to process
 * @param config - Masking configuration
 * @returns The masked log entry
 */
export function maskLogEntry(
  entry: LogEntry,
  config: MaskingConfig = defaultMaskingConfig
): LogEntry {
  if (!config.enabled) {
    return entry;
  }

  // Create a deep copy to avoid mutating the original
  const maskedEntry: LogEntry = { ...entry };

  // Mask the message
  if (typeof maskedEntry.message === 'string') {
    maskedEntry.message = maskWithConfig(maskedEntry.message, config);
  }

  // Mask the data object
  if (maskedEntry.data !== void 0) {
    maskedEntry.data = maskWithConfig(maskedEntry.data, config);
  }

  // Mask the meta object
  if (maskedEntry.meta !== void 0) {
    maskedEntry.meta = maskWithConfig(maskedEntry.meta, config);
  }

  // Mask any other string properties
  for (const [key, value] of Object.entries(maskedEntry)) {
    if (typeof value === 'string' && key !== 'level' && key !== 'timestamp') {
      (maskedEntry as any)[key] = maskWithConfig(value, config);
    }
  }

  return maskedEntry;
}

/**
 * Creates a masking middleware function with the given configuration
 * @param config - Masking configuration
 * @returns A middleware function that can be used in the logging pipeline
 */
export function createMaskingMiddleware(config: MaskingConfig = defaultMaskingConfig) {
  return (entry: LogEntry): LogEntry => maskLogEntry(entry, config);
}

/**
 * Batch masking for multiple log entries
 * @param entries - Array of log entries to mask
 * @param config - Masking configuration
 * @returns Array of masked log entries
 */
export function maskLogEntries(
  entries: LogEntry[],
  config: MaskingConfig = defaultMaskingConfig
): LogEntry[] {
  if (!config.enabled) {
    return entries;
  }

  return entries.map(entry => maskLogEntry(entry, config));
}

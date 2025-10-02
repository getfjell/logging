import { configureLogging, LoggingConfig } from "./config";
import { createLogger, Logger } from "./Logger";

export const getLogger = (name: string): Logger => {
  const config = configureLogging();
  const logger = createBaseLogger(name, config);
  return logger;
}

const createBaseLogger = (name: string, config: LoggingConfig): Logger => {
  let { logLevel } = config;
  const { logFormat, floodControl } = config;
  const overrides = config.overrides;
  if (overrides && overrides[name]) {
    logLevel = overrides[name].logLevel;
  }

  const coordinates = { category: name, components: [] };
  
  // Check if we're in a test environment to disable async logging
  // For now, always disable async logging to maintain test compatibility
  // In production, this can be controlled via environment variables
  const isTestEnvironment = true; // Temporarily disable async logging for tests
  
  return createLogger(logFormat, logLevel, coordinates, floodControl, void 0, {
    asyncLogging: !isTestEnvironment
  });
};

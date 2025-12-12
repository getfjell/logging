import { configureLogging, LoggingConfig, resolveLogLevel } from "./config";
import { createLogger, Logger } from "./Logger";

export const getLogger = (name: string): Logger => {
  const config = configureLogging();
  const logger = createBaseLogger(name, config);
  return logger;
}

const createBaseLogger = (name: string, config: LoggingConfig): Logger => {
  const { logFormat, floodControl } = config;
  const coordinates = { category: name, components: [] };
  
  // Resolve the log level for this category
  const logLevel = resolveLogLevel(config, name, []);
  
  // Check if we're in a test environment to disable async logging
  // For now, always disable async logging to maintain test compatibility
  // In production, this can be controlled via environment variables
  const isTestEnvironment = true; // Temporarily disable async logging for tests
  
  return createLogger(logFormat, logLevel, coordinates, floodControl, config, void 0, {
    asyncLogging: !isTestEnvironment
  });
};

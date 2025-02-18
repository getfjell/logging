import { configureLogging, LoggingConfig } from "./config";
import { createLogger, Logger } from "./Logger";

export const getLogger = (name: string): Logger => {
  const config = configureLogging();
  const logger = createBaseLogger(name, config);
  return logger;
}

const createBaseLogger = (name: string, config: LoggingConfig): Logger => {
  let { logLevel } = config;
  const { logFormat } = config;
  const overrides = config.overrides;
  if (overrides && overrides[name]) {
    logLevel = overrides[name].logLevel;
  }

  const coordinates = { category: name, components: [] };
  return createLogger(logFormat, logLevel, coordinates);
};

import * as LogFormat from "./LogFormat";
import * as LogLevel from "./LogLevel";

export type LoggingConfig = {
  logFormat: LogFormat.Config;
  logLevel: LogLevel.Config;
  overrides: Record<string, { logLevel: LogLevel.Config }>;
};

const defaultLogLevel: LogLevel.Config = LogLevel.INFO;
const defaultLogFormat: LogFormat.Config = LogFormat.TEXT;

export const defaultLoggingConfig: LoggingConfig = {
  logLevel: defaultLogLevel,
  logFormat: defaultLogFormat,
  overrides: {},
}

// When we read the config from the environment, we need to convert the overrides to the correct format
export const convertOverrides = (overrides: any): Record<string, { logLevel: LogLevel.Config }> => {
  const convertedOverrides: Record<string, { logLevel: LogLevel.Config }> = {};
  if(overrides) {
    Object.entries(overrides).forEach(([key, value] : [string, any]) => {
      convertedOverrides[key] = { logLevel: value.logLevel ? LogLevel.getConfig(value.logLevel) : defaultLogLevel };
    });
  }
  return convertedOverrides;
}

// When we read the config from the environment, we need to convert the config to the correct format
export const convertConfig = (config: any): LoggingConfig => {
  return {
    logLevel: config.logLevel ? LogLevel.getConfig(config.logLevel) : defaultLogLevel,
    logFormat: config.logFormat ? LogFormat.getConfig(config.logFormat) : defaultLogFormat,
    overrides: convertOverrides(config.overrides),
  };
}

export const configureLogging = (): LoggingConfig => {
  let config: any = {};

  const loggingConfigEnv = process.env.LOGGING_CONFIG;
  const expoLoggingConfigEnv = process.env.EXPO_PUBLIC_LOGGING_CONFIG;
  const nextLoggingConfigEnv = process.env.NEXT_PUBLIC_LOGGING_CONFIG;
  let logLevelEnv = process.env.LOG_LEVEL;
  let logFormatEnv = process.env.LOG_FORMAT;

  if (loggingConfigEnv) {
    config = JSON.parse(loggingConfigEnv);
  } else if (expoLoggingConfigEnv) {
    config = JSON.parse(expoLoggingConfigEnv);
  } else if (nextLoggingConfigEnv) {
    config = JSON.parse(nextLoggingConfigEnv);
  }

  const convertedConfig: LoggingConfig = convertConfig(config);

  if (logLevelEnv) {
    logLevelEnv = logLevelEnv?.toUpperCase();
    const logLevelConfig = LogLevel.getConfig(logLevelEnv as LogLevel.LogLevelName);
    convertedConfig.logLevel = logLevelConfig;
  }

  if (logFormatEnv) {
    logFormatEnv = logFormatEnv.toUpperCase();
    const logFormatConfig = LogFormat.getConfig(logFormatEnv as LogFormat.LogFormatName);
    convertedConfig.logFormat = logFormatConfig;
  }

  // Override anything missing with defaults
  config = { ...defaultLoggingConfig, ...convertedConfig };

  return {
    ...convertedConfig,
  };
}

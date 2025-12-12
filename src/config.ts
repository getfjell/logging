import * as LogFormat from "./LogFormat";
import * as LogLevel from "./LogLevel";
import { FloodControlConfig } from "./FloodControl";
import { defaultMaskingConfig, MaskingConfig } from "./utils/maskSensitive";

export type ComponentOverride = {
  logLevel: LogLevel.Config;
  components?: Record<string, ComponentOverride>;
};

export type LoggingConfig = {
  logFormat: LogFormat.Config;
  logLevel: LogLevel.Config;
  overrides: Record<string, ComponentOverride>;
  floodControl: FloodControlConfig;
  masking: MaskingConfig;
};

const defaultLogLevel: LogLevel.Config = LogLevel.INFO;
const defaultLogFormat: LogFormat.Config = LogFormat.TEXT;

export const defaultLoggingConfig: LoggingConfig = {
  logLevel: defaultLogLevel,
  logFormat: defaultLogFormat,
  overrides: {},
  floodControl: {
    enabled: false,
    threshold: 10,
    timeframe: 1000, // 1 second
  },
  masking: defaultMaskingConfig,
}

// Helper function to recursively convert component overrides
const convertComponentOverride = (override: any): ComponentOverride => {
  const result: ComponentOverride = {
    logLevel: override.logLevel ? LogLevel.getConfig(override.logLevel) : defaultLogLevel
  };

  // Recursively convert nested component overrides
  if (override.components && typeof override.components === 'object') {
    result.components = {};
    Object.entries(override.components).forEach(([componentName, componentOverride]: [string, any]) => {
      result.components![componentName] = convertComponentOverride(componentOverride);
    });
  }

  return result;
};

// When we read the config from the environment, we need to convert the overrides to the correct format
export const convertOverrides = (overrides: any): Record<string, ComponentOverride> => {
  const convertedOverrides: Record<string, ComponentOverride> = {};
  if (overrides) {
    Object.entries(overrides).forEach(([key, value]: [string, any]) => {
      convertedOverrides[key] = convertComponentOverride(value);
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
    floodControl: {
      ...defaultLoggingConfig.floodControl,
      ...(config.floodControl || {})
    },
    masking: {
      ...defaultLoggingConfig.masking,
      ...(config.masking || {})
    },
  };
}

/**
 * Resolves the log level for a given category and component path by walking
 * the component hierarchy in the configuration.
 *
 * @param config - The logging configuration
 * @param category - The logger category (e.g., '@fjell/cache')
 * @param components - Array of component names (e.g., ['CacheWarmer', 'SubComponent'])
 * @returns The resolved log level configuration
 */
export const resolveLogLevel = (
  config: LoggingConfig,
  category: string,
  components: string[]
): LogLevel.Config => {
  let logLevel = config.logLevel;
  const overrides = config.overrides;

  // Check if there's a category-level override
  if (!overrides || !overrides[category]) {
    return logLevel;
  }

  // Start with the category override
  let currentOverride: ComponentOverride = overrides[category];
  logLevel = currentOverride.logLevel;

  // Walk through the component hierarchy
  for (const component of components) {
    if (!currentOverride.components || !currentOverride.components[component]) {
      // No more specific override found, use current level
      break;
    }
    currentOverride = currentOverride.components[component];
    logLevel = currentOverride.logLevel;
  }

  return logLevel;
};

export const configureLogging = (): LoggingConfig => {
  let config: any = {};

  const loggingConfigEnv = process.env.LOGGING_CONFIG;
  const expoLoggingConfigEnv = process.env.EXPO_PUBLIC_LOGGING_CONFIG;
  const nextLoggingConfigEnv = process.env.NEXT_PUBLIC_LOGGING_CONFIG;
  let logLevelEnv = process.env.LOG_LEVEL;
  let logFormatEnv = process.env.LOG_FORMAT;

  if (loggingConfigEnv) {
    try {
      config = JSON.parse(loggingConfigEnv);
    } catch (error) {
      console.error('Invalid JSON in LOGGING_CONFIG environment variable:', error);
      config = {};
    }
  } else if (expoLoggingConfigEnv) {
    try {
      config = JSON.parse(expoLoggingConfigEnv);
    } catch (error) {
      console.error('Invalid JSON in EXPO_PUBLIC_LOGGING_CONFIG environment variable:', error);
      config = {};
    }
  } else if (nextLoggingConfigEnv) {
    try {
      config = JSON.parse(nextLoggingConfigEnv);
    } catch (error) {
      console.error('Invalid JSON in NEXT_PUBLIC_LOGGING_CONFIG environment variable:', error);
      config = {};
    }
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
  const finalConfig = { ...defaultLoggingConfig, ...convertedConfig };

  return finalConfig;
}

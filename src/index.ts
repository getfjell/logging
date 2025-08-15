import { getLogger } from "./logging";

export { getLogger };
export type { Logger, TimeLogger } from "./Logger";
export type { LoggingConfig } from "./config";
export type { FloodControlConfig } from "./FloodControl";
export * as LogLevel from "./LogLevel";
export * as LogFormat from "./LogFormat";
export { safeFormat, safeInspect, stringifyJSON } from "./utils";

// Export masking utilities
export {
  maskString,
  maskObject,
  maskWithConfig,
  MaskingConfig,
  defaultMaskingConfig
} from "./utils/maskSensitive";
export {
  createMaskingMiddleware,
  maskLogEntry,
  maskLogEntries
} from "./middleware/maskMiddleware";

export default { getLogger };

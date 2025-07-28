import { getLogger } from "./logging";

export { getLogger };
export type { Logger, TimeLogger } from "./Logger";
export type { LoggingConfig } from "./config";
export type { FloodControlConfig } from "./FloodControl";
export * as LogLevel from "./LogLevel";
export * as LogFormat from "./LogFormat";

export default { getLogger };

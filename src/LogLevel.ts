export type LogLevelName =
  "EMERGENCY" | "ALERT" | "CRITICAL" | "ERROR" | "WARNING" | "NOTICE" | "INFO" | "DEBUG" | "TRACE" | "DEFAULT";

export interface Config {
  name: LogLevelName;
  value: number;
}

export const EMERGENCY: Config = {
  name: "EMERGENCY",
  value: 0,
}
export const ALERT: Config = {
  name: "ALERT",
  value: 1,
}
export const CRITICAL: Config = {
  name: "CRITICAL",
  value: 2,
}
export const ERROR: Config = {
  name: "ERROR",
  value: 3,
}
export const WARNING: Config = {
  name: "WARNING",
  value: 4,
}
export const NOTICE: Config = {
  name: "NOTICE",
  value: 5,
}
export const INFO: Config = {
  name: "INFO",
  value: 6,
}
export const DEBUG: Config = {
  name: "DEBUG",
  value: 7,
}
export const TRACE: Config = {
  name: "TRACE",
  value: 8,
}
export const DEFAULT: Config = {
  name: "DEFAULT",
  value: 9,
}

export const LogLevels: Config[] = [
  EMERGENCY,
  ALERT,
  CRITICAL,
  ERROR,
  WARNING,
  NOTICE,
  INFO,
  DEBUG,
  TRACE,
  DEFAULT,
];

export const getConfig = (name: LogLevelName): Config => {
  const config = LogLevels.find(config => config.name === name);
  if (!config) {
    throw new Error(`Invalid Log Level Supplied to Logging Configuration '${name}'`);
  }
  return config;
}

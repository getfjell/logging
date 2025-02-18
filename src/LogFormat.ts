export type LogFormatName = "TEXT" | "STRUCTURED";

export interface Config {
    name: LogFormatName;
    description: string;
}

export const TEXT: Config = {
  name: "TEXT",
  description: "Text format",
}

export const STRUCTURED: Config = {
  name: "STRUCTURED",
  description: "Structured format",
}

export const LogFormats: Config[] = [
  TEXT,
  STRUCTURED,
]

export const getConfig = (name: LogFormatName): Config => {
  const config = LogFormats.find(config => config.name === name);
  if (!config) {
    throw new Error(`Invalid Log Format Supplied to Logging Configuration '${name}'`);
  }
  return config;
}
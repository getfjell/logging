import { Formatter } from "./formatter";
import * as LogLevel from "./LogLevel";

export interface Writer {
  write: (
    level: LogLevel.Config,
    coordinates: {
      category: string,
      components: string[]
    },
    payload: {
      message: string,
      data: any[],
    },
  ) => void;
}

export interface WriterOptions {
  respectInjectedMethod?: boolean;
  errorMethod?: (...args: any[]) => void;
  warningMethod?: (...args: any[]) => void;
  infoMethod?: (...args: any[]) => void;
}

export const createWriter = (
  formatter: Formatter,
  logMethod: (...args: any[]) => void,
  options: WriterOptions = {}
): Writer => {
  const {
    respectInjectedMethod = false,
    errorMethod = console.error,
    warningMethod = console.warn,
    infoMethod = console.log
  } = options;

  return {
    write: (
      level: LogLevel.Config,
      coordinates: { category: string, components: string[] },
      payload: { message: string, data: any[] },
    ) => {
      let finalLogMethod = logMethod;

      // If respectInjectedMethod is true, use the injected method for all levels
      // Otherwise, use level-specific routing (backward compatible behavior)
      if (!respectInjectedMethod) {
        if (level.name === LogLevel.ERROR.name ||
          level.name === LogLevel.CRITICAL.name ||
          level.name === LogLevel.ALERT.name ||
          level.name === LogLevel.EMERGENCY.name) {
          finalLogMethod = errorMethod;
        } else if (level.name === LogLevel.WARNING.name) {
          finalLogMethod = warningMethod;
        } else {
          finalLogMethod = infoMethod;
        }
      }

      finalLogMethod(formatter.formatLog(level, coordinates, payload));
    },
  };
}

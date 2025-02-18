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

export const createWriter = (formatter: Formatter, logMethod: (...args: any[]) => void): Writer => {
  return {
    write: (
      level: LogLevel.Config,
      coordinates: { category: string, components: string[] },
      payload: { message: string, data: any[] },
    ) => {
      // TODO: I don't like that this is here, but it works for now.  Need a more configurable solution.
      let finalLogMethod = logMethod;
      if( level.name === LogLevel.ERROR.name ||
        level.name === LogLevel.CRITICAL.name ||
        level.name === LogLevel.ALERT.name ||
        level.name === LogLevel.EMERGENCY.name ) {
        finalLogMethod = console.error;
      } else if( level.name === LogLevel.WARNING.name ) {
        finalLogMethod = console.warn;
      } else {
        finalLogMethod = console.log;
      }
      finalLogMethod(formatter.formatLog(level, coordinates, payload));
    },
  };
}

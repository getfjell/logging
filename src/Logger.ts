import * as LogLevel from "./LogLevel";
import * as LogFormat from "./LogFormat";
import { createWriter } from "./Writer";
import { createFormatter } from "./formatter";

export interface TimeLogger {
  end: () => void;
  log: (...data: any[]) => void;
}

export interface Logger {
    emergency: (message: string, ...data: any[]) => void;
    alert: (message: string, ...data: any[]) => void;
    critical: (message: string, ...data: any[]) => void;
    error: (message: string, ...data: any[]) => void;
    warning: (message: string, ...data: any[]) => void;
    notice: (message: string, ...data: any[]) => void;
    info: (message: string, ...data: any[]) => void;
    debug: (message: string, ...data: any[]) => void;
    trace: (message: string, ...data: any[]) => void;
    default: (message: string, ...data: any[]) => void;
    time: (message: string, ...data: any[]) => TimeLogger;
    get: (...additionalComponents: string[]) => Logger;
}

export const createLogger = (
  logFormat: LogFormat.Config,
  logLevel: LogLevel.Config,
  coordinates: { category: string, components: string[] },
): Logger => {
  const formatter = createFormatter(logFormat);

  // TODO: Ok, this needs to be a bit more configurable.
  const logFunction = console.log;

  // TODO: This is where you could change the destination.
  const writer = createWriter(formatter, logFunction);

  const startTimeLogger = (
    logLevel: LogLevel.Config,
    coordinates: {
      category: string,
      components: string[]
    },
    payload: {
      message: string,
      data: any[],
    }
    // eslint-disable-next-line max-params
  ): TimeLogger => {
    const timerMessage = formatter.timerMessage(logLevel, coordinates, payload);

    //console.log(`Starting Timer ${timerMessage}`);
    logLevel.value >= LogLevel.DEBUG.value &&
      console.time( timerMessage );

    return {
      end: () => {
        logLevel.value >= LogLevel.DEBUG.value &&
          console.timeEnd(timerMessage);
      },
      log: (...data: any[]) => {
        logLevel.value >= LogLevel.DEBUG.value &&
          console.timeLog(timerMessage, ...data);
      },
    };
  };

  return {
    emergency: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.EMERGENCY.value &&
            writer.write(LogLevel.EMERGENCY, coordinates, payload);
    },
    alert: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.ALERT.value &&
            writer.write(LogLevel.ALERT, coordinates, payload);
    },
    critical: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.CRITICAL.value &&
            writer.write(LogLevel.CRITICAL, coordinates, payload);
    },
    error: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.ERROR.value &&
            writer.write(LogLevel.ERROR, coordinates, payload);
    },
    warning: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.WARNING.value &&
            writer.write(LogLevel.WARNING, coordinates, payload);
    },
    notice: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.NOTICE.value &&
            writer.write(LogLevel.NOTICE, coordinates, payload);
    },
    info: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.INFO.value &&
            writer.write(LogLevel.INFO, coordinates, payload);
    },
    debug: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.DEBUG.value &&
            writer.write(LogLevel.DEBUG, coordinates, payload);
    },
    trace: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.DEBUG.value &&
            writer.write(LogLevel.DEBUG, coordinates, payload);
    },
    default: (message: string, ...data: any[]) => {
      const payload = { message, data };
      logLevel.value >= LogLevel.DEFAULT.value &&
            writer.write(LogLevel.DEFAULT, coordinates, payload);
    },
    time: (message: string, ...data: any[]) => {
      const payload = { message, data };
      return startTimeLogger(logLevel, coordinates, payload);
    },
    get: (...additionalComponents: string[]) => {
      return createLogger(logFormat, logLevel, {
        category: coordinates.category,
        components: [...coordinates.components, ...additionalComponents],
      });
    }
  };
}
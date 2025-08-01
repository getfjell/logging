// eslint-disable no-unused-expressions
import * as LogLevel from "./LogLevel";
import * as LogFormat from "./LogFormat";
import { createWriter, WriterOptions } from "./Writer";
import { createFormatter } from "./formatter";
import { FloodControl, FloodControlConfig } from "./FloodControl";

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
  destroy: () => void;
}

export const createLogger = (
  logFormat: LogFormat.Config,
  logLevel: LogLevel.Config,
  coordinates: { category: string, components: string[] },
  floodControlConfig: FloodControlConfig,
  writerOptions?: WriterOptions,
): Logger => {
  const formatter = createFormatter(logFormat);
  const floodControl = floodControlConfig.enabled ? new FloodControl(floodControlConfig) : null;

  // TODO: Ok, this needs to be a bit more configurable.
  const logFunction = console.log;

  // TODO: This is where you could change the destination.
  const writer = createWriter(formatter, logFunction, writerOptions);

  const write = (level: LogLevel.Config, message: string, data: any[]) => {
    if (logLevel.value < level.value) {
      return;
    }

    const check = floodControl ? floodControl.check(message, data) : 'log';
    const payload = { message, data };

    switch (check) {
      case 'log':
        writer.write(level, coordinates, payload);
        break;
      case 'suppress':
        // The first time we suppress, we could log a message.
        // For now, we do nothing. The requirement is to just dial-down.
        if (floodControl && floodControl.getSuppressedCount(message, data) === 1) {
          const originalLevel = level;
          const newPayload = { message: `Started suppressing repeated log message`, data: [] };
          writer.write(originalLevel, coordinates, newPayload);
        }
        break;
      case 'resume': {
        const count = floodControl ? floodControl.getSuppressedCount(message, data) : 0;
        const resumePayload = {
          message: `Stopped suppressing repeated log message. Suppressed ${count} times.`,
          data: []
        };
        writer.write(level, coordinates, resumePayload);
        writer.write(level, coordinates, payload); // log the current message
        break;
      }
    }
  }

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
  ): TimeLogger => {
    const timerMessage = formatter.timerMessage(logLevel, coordinates, payload);

    //console.log(`Starting Timer ${timerMessage}`);
    logLevel.value >= LogLevel.DEBUG.value &&
      console.time(timerMessage);

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
      write(LogLevel.EMERGENCY, message, data);
    },
    alert: (message: string, ...data: any[]) => {
      write(LogLevel.ALERT, message, data);
    },
    critical: (message: string, ...data: any[]) => {
      write(LogLevel.CRITICAL, message, data);
    },
    error: (message: string, ...data: any[]) => {
      write(LogLevel.ERROR, message, data);
    },
    warning: (message: string, ...data: any[]) => {
      write(LogLevel.WARNING, message, data);
    },
    notice: (message: string, ...data: any[]) => {
      write(LogLevel.NOTICE, message, data);
    },
    info: (message: string, ...data: any[]) => {
      write(LogLevel.INFO, message, data);
    },
    debug: (message: string, ...data: any[]) => {
      write(LogLevel.DEBUG, message, data);
    },
    trace: (message: string, ...data: any[]) => {
      write(LogLevel.TRACE, message, data);
    },
    default: (message: string, ...data: any[]) => {
      write(LogLevel.DEFAULT, message, data);
    },
    time: (message: string, ...data: any[]) => {
      const payload = { message, data };
      return startTimeLogger(logLevel, coordinates, payload);
    },
    get: (...additionalComponents: string[]) => {
      return createLogger(logFormat, logLevel, {
        category: coordinates.category,
        components: [...coordinates.components, ...additionalComponents],
      }, floodControlConfig, writerOptions);
    },
    destroy: () => {
      if (floodControl) {
        floodControl.destroy();
      }
    }
  };
}

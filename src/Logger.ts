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
  options?: { asyncLogging?: boolean },
): Logger => {
  const formatter = createFormatter(logFormat);
  const floodControl = floodControlConfig.enabled ? new FloodControl(floodControlConfig) : null;

  // TODO: Ok, this needs to be a bit more configurable.
  const logFunction = console.log;

  // TODO: This is where you could change the destination.
  const writer = createWriter(formatter, logFunction, writerOptions);

  // Default to async logging unless explicitly disabled (for tests)
  const asyncLogging = options?.asyncLogging !== false;
  
  // Disable debug level buffering in test mode to maintain test compatibility
  const enableDebugBuffering = asyncLogging;

  // Buffer for debug level messages (TRACE, DEFAULT, DEBUG) to improve performance
  const debugBuffer: Array<{
    level: LogLevel.Config;
    coordinates: { category: string, components: string[] };
    payload: { message: string, data: any[] };
  }> = [];
  
  const DEBUG_BUFFER_SIZE = 100; // Buffer up to 100 debug messages
  const DEBUG_FLUSH_INTERVAL = 100; // Flush every 100ms
  
  let debugFlushTimer: NodeJS.Timeout | null = null;

  // Flush debug buffer with error handling
  const flushDebugBuffer = () => {
    if (debugBuffer.length === 0) return;
    
    try {
      const messagesToFlush = [...debugBuffer];
      debugBuffer.length = 0; // Clear the buffer
      
      // Write all buffered messages with individual error handling
      messagesToFlush.forEach(({ level, coordinates, payload }) => {
        try {
          writer.write(level, coordinates, payload);
        } catch (error) {
          // Log the error to console.error but don't let it crash the app
          console.error('[Fjell Logging] Error writing buffered log message:', error);
        }
      });
    } catch (error) {
      // If the entire flush operation fails, log it but don't crash
      console.error('[Fjell Logging] Error flushing debug buffer:', error);
    } finally {
      if (debugFlushTimer) {
        clearTimeout(debugFlushTimer);
        debugFlushTimer = null;
      }
    }
  };

  // Schedule debug buffer flush with error handling
  const scheduleDebugFlush = () => {
    if (debugFlushTimer) return; // Already scheduled
    
    try {
      debugFlushTimer = setTimeout(() => {
        try {
          flushDebugBuffer();
        } catch (error) {
          // If the scheduled flush fails, log it but don't crash
          console.error('[Fjell Logging] Error in scheduled debug flush:', error);
        }
      }, DEBUG_FLUSH_INTERVAL);
    } catch (error) {
      // If scheduling the timer fails, log it but don't crash
      console.error('[Fjell Logging] Error scheduling debug flush:', error);
    }
  };

  // Helper function to write immediately with error handling
  const writeImmediate = (level: LogLevel.Config, coordinates: { category: string, components: string[] }, payload: { message: string, data: any[] }) => {
    try {
      writer.write(level, coordinates, payload);
    } catch (error) {
      console.error('[Fjell Logging] Error writing log message:', error);
    }
  };

  // Helper function to handle debug level buffering
  const handleDebugBuffering = (level: LogLevel.Config, coordinates: { category: string, components: string[] }, payload: { message: string, data: any[] }) => {
    try {
      debugBuffer.push({ level, coordinates, payload });
      
      // Flush immediately if buffer is full
      if (debugBuffer.length >= DEBUG_BUFFER_SIZE) {
        flushDebugBuffer();
      } else {
        scheduleDebugFlush();
      }
    } catch (error) {
      // If buffering fails, fall back to immediate write
      console.error('[Fjell Logging] Error buffering debug message, falling back to immediate write:', error);
      writeImmediate(level, coordinates, payload);
    }
  };

  const write = (level: LogLevel.Config, message: string, data: any[]) => {
    // Early exit: Check log level before any processing
    if (logLevel.value < level.value) {
      return;
    }

    const check = floodControl ? floodControl.check(message, data) : 'log';
    const payload = { message, data };

    // Use async logging to prevent blocking the event loop
    const asyncWrite = () => {
      try {
        switch (check) {
          case 'log':
            // For high-volume debug level messages, use buffering for better performance (only in production)
            if (enableDebugBuffering && (level.name === 'TRACE' || level.name === 'DEFAULT' || level.name === 'DEBUG')) {
              handleDebugBuffering(level, coordinates, payload);
            } else {
              writeImmediate(level, coordinates, payload);
            }
            break;
          case 'suppress':
            // The first time we suppress, we could log a message.
            // For now, we do nothing. The requirement is to just dial-down.
            if (floodControl && floodControl.getSuppressedCount(message, data) === 1) {
              try {
                const originalLevel = level;
                const newPayload = { message: `Started suppressing repeated log message`, data: [] };
                writer.write(originalLevel, coordinates, newPayload);
              } catch (error) {
                console.error('[Fjell Logging] Error writing suppress message:', error);
              }
            }
            break;
          case 'resume': {
            try {
              const count = floodControl ? floodControl.getSuppressedCount(message, data) : 0;
              const resumePayload = {
                message: `Stopped suppressing repeated log message. Suppressed ${count} times.`,
                data: []
              };
              writer.write(level, coordinates, resumePayload);
              writer.write(level, coordinates, payload); // log the current message
            } catch (error) {
              console.error('[Fjell Logging] Error writing resume messages:', error);
            }
            break;
          }
        }
      } catch (error) {
        // If the entire async write operation fails, log it but don't crash
        console.error('[Fjell Logging] Error in async write operation:', error);
      }
    };

    // Use async or sync logging based on configuration
    if (asyncLogging) {
      try {
        if (typeof setImmediate !== 'undefined') {
          setImmediate(asyncWrite);
        } else {
          // Fallback for environments without setImmediate
          setTimeout(asyncWrite, 0);
        }
      } catch (error) {
        // If async scheduling fails, try synchronous write as last resort
        console.error('[Fjell Logging] Error scheduling async write, falling back to sync:', error);
        try {
          asyncWrite();
        } catch (syncError) {
          console.error('[Fjell Logging] Error in synchronous fallback write:', syncError);
        }
      }
    } else {
      // Synchronous logging for tests
      asyncWrite();
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
      }, floodControlConfig, writerOptions, options);
    },
    destroy: () => {
      try {
        // Flush any remaining debug messages before destroying
        flushDebugBuffer();
      } catch (error) {
        console.error('[Fjell Logging] Error flushing debug buffer during destroy:', error);
      }
      
      try {
        // Clear any pending timer
        if (debugFlushTimer) {
          clearTimeout(debugFlushTimer);
          debugFlushTimer = null;
        }
      } catch (error) {
        console.error('[Fjell Logging] Error clearing debug flush timer during destroy:', error);
      }
      
      try {
        if (floodControl) {
          floodControl.destroy();
        }
      } catch (error) {
        console.error('[Fjell Logging] Error destroying flood control during destroy:', error);
      }
    }
  };
}

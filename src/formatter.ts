import util from 'util';
import * as LogFormat from "./LogFormat";
import * as LogLevel from "./LogLevel";

export interface Formatter {

    getLogFormat: () => LogFormat.Config;

    formatLog: (
        level: LogLevel.Config,
        coordinates: { category: string, components: string[] },
        payload: { message: string, data: any[] },
    ) => string;

    timerMessage: (
        level: LogLevel.Config,
        coordinates: { category: string, components: string[] },
        payload: { message: string, data: any[] },
    ) => string;

}

export const createFormatter = (logFormat: LogFormat.Config): Formatter => {
  if (logFormat.name === "TEXT") {
    return getTextFormatter();
  } else if (logFormat.name === "STRUCTURED") {
    return getStructuredFormatter();
  }

  throw new Error(`Unknown log format: ${logFormat.name}`);
}

export const getTextFormatter = (): Formatter => {

  const formatLog = (
    level: LogLevel.Config,
    coordinates: { category: string, components: string[] },
    payload: { message: string, data: any[] },
  ) => {
    return `(${new Date().valueOf()}) [${level.name}] - ` +
        `[${coordinates.category}] ${coordinates.components.map((c) => `[${c}]`)} ` +
        `${util.format(payload.message, ...payload.data)} ${util.inspect(payload.data)}`;
  }

  const timerMessage = (
    level: LogLevel.Config,
    coordinates: { category: string, components: string[] },
    payload: { message: string, data: any[] },
  ) => {

    const randomInt = Math.floor(Math.random() * 1000000);
    const timerMessage =
      `(${new Date().valueOf()}) [${level.name}] - ` +
      `[${coordinates.category}] ${coordinates.components.map((c) => `[${c}]`)} ` +
      `${util.format(payload.message, ...payload.data)} ${JSON.stringify(payload.data)} ${randomInt}`;

    return timerMessage;
  }

  return { formatLog, timerMessage, getLogFormat: () => LogFormat.TEXT };
}

export const getStructuredFormatter = (): Formatter => {

  const formatLog = (
    level: LogLevel.Config,
    coordinates: { category: string, components: string[] },
    payload: { message: string, data: any[] },
  ) => {
    const severity = level.name;

    return JSON.stringify({
      severity,
      message: util.format(payload.message, ...payload.data),
      "logging.googleapis.com/labels": {
        category: coordinates.category,
        components: `${coordinates.components.map((c) => `[${c}]`)}`,
      },
      data: { ...payload.data },
    });
  }

  const timerMessage = (
    level: LogLevel.Config,
    coordinates: { category: string, components: string[] },
    payload: { message: string, data: any[] },
  ) => {
    const severity = level.name;

    const randomInt = Math.floor(Math.random() * 1000000);
    return JSON.stringify({
      severity,
      message: util.format(payload.message, ...payload.data),
      "logging.googleapis.com/labels": {
        category: coordinates.category,
        components: `${coordinates.components.map((c) => `[${c}]`)}`,
      },
      data: { ...payload.data },
      "logging.googleapis.com/spanId": String(randomInt) });
  }

  return { formatLog, timerMessage, getLogFormat: () => LogFormat.STRUCTURED };
}

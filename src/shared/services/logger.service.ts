import pino from "pino";
import { config } from "../config";

export interface ILoggerService {
  info(message: string, data?: object): void;
  error(message: string, error?: Error | unknown, data?: object): void;
  warn(message: string, data?: object): void;
  debug(message: string, data?: object): void;
  fatal(message: string, error?: Error | unknown, data?: object): void;
}

class LoggerService implements ILoggerService {
  private static instance: LoggerService | null = null;
  private logger: pino.Logger;

  private constructor() {
    this.logger = pino({
      level: config.isDev ? "debug" : "info",
      ...(config.isDev
        ? {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
                ignore: "pid,hostname",
              },
            },
          }
        : {}),
    });
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  info(message: string, data?: object): void {
    this.logger.info(data, message);
  }

  error(message: string, error?: Error | unknown, data?: object): void {
    if (error instanceof Error) {
      this.logger.error({ err: error, ...data }, message);
    } else {
      this.logger.error(data, message);
    }
  }

  warn(message: string, data?: object): void {
    this.logger.warn(data, message);
  }

  debug(message: string, data?: object): void {
    this.logger.debug(data, message);
  }

  fatal(message: string, error?: Error | unknown, data?: object): void {
    if (error instanceof Error) {
      this.logger.fatal({ err: error, ...data }, message);
    } else {
      this.logger.fatal(data, message);
    }
  }
}

export default LoggerService;

export interface ILoggerService {
  info(message: string, data?: object): void;
  error(message: string, error?: Error | unknown, data?: object): void;
  warn(message: string, data?: object): void;
  debug(message: string, data?: object): void;
  fatal(message: string, error?: Error | unknown, data?: object): void;
}

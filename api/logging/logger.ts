import * as winston from 'winston';

export class Logger {
  private static singletonLogger:winston.Logger;

  public static Logger() {
    if (this.singletonLogger === undefined) {
      this.singletonLogger = winston.createLogger({
        level: process.env.LOG_LEVEL === undefined ? 'info' : process.env.LOG_LEVEL,
        transports: [
          new winston.transports.File({
            filename: './logs/combined.log',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          })
        ]
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      this.singletonLogger.add(new winston.transports.Console({format: winston.format.simple()}));
    }

    return this.singletonLogger;
  }
}



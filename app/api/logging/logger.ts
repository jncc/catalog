import * as winston from 'winston';

import "mocha"; // test reqs
import "mocha-inline"; // test reqs
import * as chai from "chai"; // test reqs
import * as fs from "fs"

export class Logger {
  private static singletonLogger:winston.Logger;

  public static GetLog() {
    if (this.singletonLogger === undefined) {
      this.singletonLogger = winston.createLogger({
        level: process.env.LOG_LEVEL === undefined ? 'info' : process.env.LOG_LEVEL,
        transports: [
          new winston.transports.File({
            filename: process.env.LOG_LOCATION === undefined ? './logs/stdout.log' : process.env.LOG_LOCATION,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
              winston.format.errors({ stack: true })
            )
          }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ]
      });

      this.singletonLogger.info(`Log level is ${process.env.LOG_LEVEL}`)
      this.singletonLogger.info(`Log Location is ${process.env.LOG_LOCATION}`)
    }

    return this.singletonLogger;
  }
}

// describe("Logger", () => {

//   process.env.LOG_LEVEL = "info"
//   process.env.LOG_LOCATION = "./logs/test.log"

//   let log = Logger.GetLog();

//   beforeEach(() => {

//   })

//   it("should log a valid error", () => {

//   })
// });


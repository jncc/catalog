import * as dotenv from 'dotenv';

export function getEnvironmentSettings() {
  dotenv.config();

  return {
    dev: false,
    port: 8081,  // elastic beanstalk: the default nginx configuration forwards traffic to an upstream server named nodejs at 127.0.0.1:8081
    dir: 'built'
  }
}

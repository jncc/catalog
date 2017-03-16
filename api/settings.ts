
export function getEnvironmentSettings(env: string) {
  if (env === 'development') {
    return {
      name: env,
      dev: true,
      port: 5000,
      dir: ''
    };
  }
  else {
    return {
      name: env,
      dev: false,
      port: 8081,  // elastic beanstalk: the default nginx configuration forwards traffic to an upstream server named nodejs at 127.0.0.1:8081
      //dir: 'built/app.client'
    };
  }
}

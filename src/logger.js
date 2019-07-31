const config = require('config');
const winston = require('winston');

const myFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ message, timestamp }) => {
    return `${timestamp}: ${message}`;
  }),
);

const logger = winston.createLogger({
  level: 'info',
  format: myFormat,
  transports: [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/combined.log' }),
  ],
});

if (config.isDev) {
  logger.add(new winston.transports.Console({
    format: myFormat,
  }));
}

module.exports = logger;

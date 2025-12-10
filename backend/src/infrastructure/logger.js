const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  ),
  transports: [],
});

// Configure transports based on environment
if (process.env.NODE_ENV !== 'production') {
  // Local Development: Log to files and console
  logger.add(new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }));
  logger.add(new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }));
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
} else {
  // Production (Vercel): Log to Console ONLY (Read-only filesystem)
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      logFormat
    )
  }));
}

module.exports = logger;

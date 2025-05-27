const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config/config');

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'remote-device-server' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    }),
    
    // Daily rotating file
    new DailyRotateFile({
      filename: config.logging.file.replace('.log', '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      zippedArchive: true
    }),

    // Error log file
    new winston.transports.File({
      filename: config.logging.file.replace('.log', '-error.log'),
      level: 'error'
    })
  ]
});

// Add request ID to logs
logger.addRequestId = (req, res, next) => {
  req.requestId = require('uuid').v4();
  logger.defaultMeta.requestId = req.requestId;
  next();
};

module.exports = logger;

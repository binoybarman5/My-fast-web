const winston = require('winston');
const expressWinston = require('express-winston');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create log directory if it doesn't exist
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File transport
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

// Morgan format for request logging
const morganFormat = ':remote-addr - :method :url :status :res[content-length] - :response-time ms';

// Morgan logger
const morganLogger = morgan(morganFormat, {
  stream: {
    write: message => logger.info(message.trim())
  }
});

// Express Winston logger for request logging
const expressLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'requests.log') })
  ],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp()
  ),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: true
});

// Express Winston error logger
const expressErrorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'errors.log') })
  ],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp()
  ),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  colorize: true
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next();
};

// Response logging middleware
const responseLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      responseSize: res.getHeader('content-length')
    });
  });
  
  next();
};

// Access logging middleware
const accessLogger = (req, res, next) => {
  logger.info('Access log', {
    timestamp: new Date(),
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: Date.now() - start,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    status: res.statusCode || 500,
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next(error);
};

// Log cleanup middleware
const cleanupLogs = () => {
  setInterval(() => {
    const now = Date.now();
    const cutoff = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    
    const logFiles = fs.readdirSync(logDir);
    logFiles.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
      }
    });
  }, 24 * 60 * 60 * 1000); // Run cleanup every 24 hours
};

module.exports = {
  logger,
  morganLogger,
  expressLogger,
  expressErrorLogger,
  requestLogger,
  responseLogger,
  accessLogger,
  errorLogger,
  cleanupLogs
};

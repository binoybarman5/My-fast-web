const winston = require('winston');
const { format } = winston;

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    // Log to console
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    }),
    // Log to file
    new winston.transports.File({
      filename: 'logs/api.log',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  ]
});

// API request logger middleware
const apiLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  logger.info('Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // Log response details
  res.on('finish', () => {
    logger.info('Response', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: Date.now() - start,
      headers: res.getHeaders()
    });
  });
  
  next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  next(err);
};

module.exports = {
  apiLogger,
  errorLogger
};

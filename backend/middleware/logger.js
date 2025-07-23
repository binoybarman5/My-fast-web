const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { format } = require('util');

// Create log directory if it doesn't exist
const logDirectory = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Create log file
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);

// Morgan format with timestamp
const logFormat = ':remote-addr - :method :url :status :response-time ms - :res[content-length]';

// Morgan middleware with custom format
const logger = morgan(logFormat, {
  stream: accessLogStream,
});

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const errorLog = format(
    '[%s] %s %s %s %s\n%s',
    new Date().toISOString(),
    req.method,
    req.originalUrl,
    err.status || 500,
    err.message,
    err.stack
  );

  fs.appendFile(
    path.join(logDirectory, 'error.log'),
    errorLog + '\n',
    (err) => {
      if (err) {
        console.error('Error writing to error log:', err);
      }
    }
  );

  next(err);
};

module.exports = {
  logger,
  errorLogger,
};

const boom = require('@hapi/boom');
const winston = require('winston');

// Custom error class
class ApiError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status || 500;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error handler
const validationErrorHandler = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const details = {};
    Object.keys(error.errors).forEach(key => {
      details[key] = error.errors[key].message;
    });
    
    const apiError = new ApiError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { details }
    );
    
    return next(apiError);
  }
  next(error);
};

// Duplicate key error handler
const duplicateKeyErrorHandler = (error, req, res, next) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    
    const apiError = new ApiError(
      `Duplicate ${field} value: ${value}`,
      400,
      'DUPLICATE_KEY',
      { field, value }
    );
    
    return next(apiError);
  }
  next(error);
};

// JWT error handler
const jwtErrorHandler = (error, req, res, next) => {
  if (error.name === 'JsonWebTokenError') {
    const apiError = new ApiError(
      'Invalid token',
      401,
      'INVALID_TOKEN'
    );
    
    return next(apiError);
  }
  
  if (error.name === 'TokenExpiredError') {
    const apiError = new ApiError(
      'Token expired',
      401,
      'TOKEN_EXPIRED'
    );
    
    return next(apiError);
  }
  next(error);
};

// Rate limit error handler
const rateLimitErrorHandler = (error, req, res, next) => {
  if (error instanceof boom.Boom) {
    const apiError = new ApiError(
      error.message,
      error.output.statusCode,
      'RATE_LIMIT_EXCEEDED',
      {
        limit: error.output.payload.limit,
        remaining: error.output.payload.remaining,
        reset: error.output.payload.reset
      }
    );
    
    return next(apiError);
  }
  next(error);
};

// Database error handler
const databaseErrorHandler = (error, req, res, next) => {
  if (error.name === 'MongoError') {
    const apiError = new ApiError(
      'Database error',
      500,
      'DATABASE_ERROR',
      { message: error.message }
    );
    
    return next(apiError);
  }
  next(error);
};

// Network error handler
const networkErrorHandler = (error, req, res, next) => {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    const apiError = new ApiError(
      'Service unavailable',
      503,
      'NETWORK_ERROR',
      { service: error.message }
    );
    
    return next(apiError);
  }
  next(error);
};

// Generic error handler
const errorHandler = (error, req, res, next) => {
  // Log error
  winston.error(error);

  // Set response status
  res.status(error.status || 500);

  // Set error headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Error-Code', error.code);

  // Set response body
  const response = {
    message: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR'
  };

  // Include details for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    response.details = error.details;
    response.stack = error.stack;
  }

  res.json(response);
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  winston.error({
    timestamp: new Date(),
    level: 'error',
    message: error.message,
    code: error.code,
    status: error.status,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next(error);
};

// Error monitoring middleware
const errorMonitoring = (error, req, res, next) => {
  // Send error to monitoring service (e.g., Sentry, New Relic)
  // This would typically be implemented with a service-specific client
  
  next(error);
};

module.exports = {
  ApiError,
  validationErrorHandler,
  duplicateKeyErrorHandler,
  jwtErrorHandler,
  rateLimitErrorHandler,
  databaseErrorHandler,
  networkErrorHandler,
  errorHandler,
  errorLogger,
  errorMonitoring
};

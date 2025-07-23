const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const csrf = require('csurf');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Security headers middleware
const securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
        blockAllMixedContent: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  });
};

// CORS configuration
const corsConfig = () => {
  return cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204
  });
};

// Rate limiting middleware
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// XSS protection middleware
const xssProtection = () => {
  return xss();
};

// HPP protection middleware
const hppProtection = () => {
  return hpp();
};

// CSRF protection middleware
const csrfProtection = () => {
  const csrfMiddleware = csrf({
    cookie: true,
    value: req => {
      if (req.headers['x-csrf-token']) {
        return req.headers['x-csrf-token'];
      }
      return req.body._csrf || req.query._csrf;
    }
  });

  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }
    csrfMiddleware(req, res, next);
  };
};

// JWT token validation middleware
const jwtTokenValidation = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next();
  }
};

// IP blocking middleware
const ipBlocking = () => {
  const blockedIps = new Set();

  return (req, res, next) => {
    if (blockedIps.has(req.ip)) {
      return res.status(403).json({
        message: 'Your IP has been blocked due to suspicious activity'
      });
    }
    next();
  };
};

// Request validation middleware
const requestValidation = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Invalid request data',
        details: error.details
      });
    }
    next();
  };
};

// SQL injection prevention middleware
const sqlInjectionProtection = () => {
  return (req, res, next) => {
    const suspiciousPatterns = /['";()]/g;
    
    const hasSuspiciousPattern = Object.values(req.body).some(
      value => typeof value === 'string' && suspiciousPatterns.test(value)
    );

    if (hasSuspiciousPattern) {
      return res.status(400).json({
        message: 'Invalid request data'
      });
    }
    next();
  };
};

// File upload validation middleware
const fileUploadValidation = () => {
  return (req, res, next) => {
    if (!req.files) {
      return next();
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of Object.values(req.files)) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          message: 'Invalid file type'
        });
      }

      if (file.size > maxSize) {
        return res.status(400).json({
          message: 'File size too large'
        });
      }
    }

    next();
  };
};

// Request body size limit middleware
const bodySizeLimit = () => {
  return (req, res, next) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (req.body && Buffer.byteLength(JSON.stringify(req.body)) > maxSize) {
      return res.status(413).json({
        message: 'Request entity too large'
      });
    }
    next();
  };
};

// Security middleware configuration
const configureSecurity = (app) => {
  app.use(securityHeaders());
  app.use(corsConfig());
  app.use(apiRateLimit);
  app.use(xssProtection());
  app.use(hppProtection());
  app.use(csrfProtection());
  app.use(jwtTokenValidation);
  app.use(ipBlocking());
};

module.exports = {
  securityHeaders,
  corsConfig,
  apiRateLimit,
  xssProtection,
  hppProtection,
  csrfProtection,
  jwtTokenValidation,
  ipBlocking,
  requestValidation,
  sqlInjectionProtection,
  fileUploadValidation,
  bodySizeLimit,
  configureSecurity
};

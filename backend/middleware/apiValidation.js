const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Common validation schemas
const schemas = {
  // User validation
  user: {
    email: {
      in: ['body'],
      isEmail: true,
      normalizeEmail: true,
      errorMessage: 'Invalid email address'
    },
    password: {
      in: ['body'],
      isLength: { min: 8 },
      matches: /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      errorMessage: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
    },
    name: {
      in: ['body'],
      isLength: { min: 2, max: 50 },
      isAlpha: true,
      errorMessage: 'Name must be between 2-50 characters and contain only letters'
    }
  },
  
  // Job validation
  job: {
    title: {
      in: ['body'],
      isLength: { min: 5, max: 100 },
      errorMessage: 'Job title must be between 5-100 characters'
    },
    description: {
      in: ['body'],
      isLength: { min: 10, max: 1000 },
      errorMessage: 'Description must be between 10-1000 characters'
    },
    price: {
      in: ['body'],
      isFloat: { min: 0 },
      errorMessage: 'Price must be a positive number'
    },
    category: {
      in: ['body'],
      isLength: { min: 2, max: 50 },
      errorMessage: 'Category must be between 2-50 characters'
    },
    location: {
      in: ['body'],
      isLength: { min: 2, max: 100 },
      errorMessage: 'Location must be between 2-100 characters'
    }
  },
  
  // Authentication validation
  auth: {
    token: {
      in: ['headers'],
      exists: true,
      errorMessage: 'Authentication token is required'
    }
  }
};

// Validation middleware
const validate = (schema) => {
  return [
    check(schema),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      next();
    }
  ];
};

// Advanced validation middleware
const advancedValidation = async (req, res, next) => {
  try {
    // Validate user existence
    if (req.body.userId) {
      const user = await mongoose.model('User').findById(req.body.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    // Validate job existence
    if (req.body.jobId) {
      const job = await mongoose.model('Job').findById(req.body.jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
    }

    // Validate category existence
    if (req.body.category) {
      const validCategories = ['web-development', 'design', 'writing', 'marketing'];
      if (!validCategories.includes(req.body.category.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    // Validate price range
    if (req.body.price) {
      const price = parseFloat(req.body.price);
      if (price < 0 || price > 1000000) {
        return res.status(400).json({
          success: false,
          message: 'Price must be between 0 and 1000000'
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// File validation middleware
const fileValidation = (req, res, next) => {
  try {
    if (!req.files) {
      return next();
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of Object.values(req.files)) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed'
        });
      }

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum allowed size is 5MB'
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Request body validation middleware
const bodyValidation = (req, res, next) => {
  try {
    const maxBodySize = 10 * 1024 * 1024; // 10MB
    const bodySize = Buffer.byteLength(JSON.stringify(req.body));

    if (bodySize > maxBodySize) {
      return res.status(413).json({
        success: false,
        message: 'Request body too large. Maximum allowed size is 10MB'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Request parameter validation middleware
const paramValidation = (req, res, next) => {
  try {
    const { id } = req.params;
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Request query validation middleware
const queryValidation = (req, res, next) => {
  try {
    const { limit, page } = req.query;
    if (limit) {
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit parameter'
        });
      }
    }
    if (page) {
      const parsedPage = parseInt(page);
      if (isNaN(parsedPage) || parsedPage <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid page parameter'
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validate,
  advancedValidation,
  fileValidation,
  bodyValidation,
  paramValidation,
  queryValidation,
  schemas
};

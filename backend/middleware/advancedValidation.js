const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Job creation validation with advanced features
const validateJobCreation = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters')
    .custom(async (value, { req }) => {
      const job = await mongoose.model('Job').findOne({ title: value });
      if (job) {
        throw new Error('A job with this title already exists');
      }
      return true;
    }),
  
  check('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['web-development', 'graphic-design', 'writing', 'video-editing', 'marketing', 'other'])
    .withMessage('Invalid category'),
  
  check('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters')
    .custom((value) => {
      // Check for minimum number of sentences
      const sentenceCount = value.match(/\w+[.!?]/g)?.length || 0;
      if (sentenceCount < 2) {
        throw new Error('Description must contain at least 2 sentences');
      }
      return true;
    }),
  
  check('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (value > 100000) {
        throw new Error('Price cannot exceed $100,000');
      }
      return true;
    }),
  
  check('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      if (date <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      if (date > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
        throw new Error('Deadline cannot be more than 1 year in the future');
      }
      return true;
    }),
  
  check('requirements')
    .isArray()
    .withMessage('Requirements must be an array')
    .custom((value) => {
      if (value.length < 2) {
        throw new Error('At least 2 requirements are required');
      }
      if (value.length > 10) {
        throw new Error('Maximum 10 requirements allowed');
      }
      return true;
    }),
  
  check('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((value) => {
      if (value.length > 5) {
        throw new Error('Maximum 5 tags allowed');
      }
      return true;
    }),
  
  check('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
    .custom((value) => {
      if (value.length > 3) {
        throw new Error('Maximum 3 attachments allowed');
      }
      return true;
    })
];

// User registration validation with advanced features
const validateUserRegistration = [
  check('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  check('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value) => {
      const user = await mongoose.model('User').findOne({ email: value });
      if (user) {
        throw new Error('This email is already registered');
      }
      return true;
    }),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be between 8 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value) => {
      // Check for common password patterns
      const commonPatterns = ['password', '123456', 'qwerty', 'admin'];
      if (commonPatterns.some(pattern => value.toLowerCase().includes(pattern))) {
        throw new Error('Password is too common and insecure');
      }
      return true;
    }),
  
  check('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  check('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  check('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('Maximum 10 skills allowed');
      }
      return true;
    }),
  
  check('portfolio')
    .optional()
    .isURL()
    .withMessage('Portfolio must be a valid URL')
    .custom(async (value) => {
      try {
        const response = await fetch(value);
        if (!response.ok) {
          throw new Error('Portfolio URL is not accessible');
        }
      } catch (error) {
        throw new Error('Portfolio URL is not accessible');
      }
      return true;
    })
];

// Request validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  validateJobCreation,
  validateUserRegistration
};

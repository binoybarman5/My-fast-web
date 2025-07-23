const express = require('express');
const path = require('path');
const compression = require('compression');

// Static files middleware
const staticFiles = express.static(path.join(__dirname, '..', 'uploads'), {
  // Set cache control for static files
  setHeaders: (res, path, stat) => {
    // Cache images for 1 year
    if (path.extname === '.jpg' || path.extname === '.jpeg' || path.extname === '.png' || path.extname === '.gif') {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    // Cache other files for 1 day
    else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  },
});

// Compress static files
const compressStatic = compression({
  threshold: 1024, // Only compress files larger than 1KB
  level: 9, // Maximum compression level
});

module.exports = {
  staticFiles,
  compressStatic,
};

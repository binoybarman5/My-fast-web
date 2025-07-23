const compression = require('compression');

// Compression middleware configuration
const compress = compression({
  threshold: 1024, // Only compress responses larger than 1KB
  level: 9, // Maximum compression level
  filter: (req, res) => {
    // Don't compress responses with these headers
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Don't compress responses with these content types
    if (req.headers['content-type']?.includes('image/')) {
      return false;
    }
    return compression.filter(req, res);
  },
});

module.exports = compress;

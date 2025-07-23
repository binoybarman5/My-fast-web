const compression = require('compression');
const brotli = require('brotli');
const zlib = require('zlib');

// Compression middleware configuration
const compressionMiddleware = compression({
  threshold: 1024, // Only compress responses larger than 1KB
  level: 9, // Maximum compression level
  filter: (req, res) => {
    // Don't compress responses with these headers
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress responses with these content types
    const contentType = res.getHeader('Content-Type');
    if (contentType && contentType.includes('image/')) {
      return false;
    }
    
    // Don't compress responses with these status codes
    const statusCode = res.statusCode;
    if (statusCode >= 400) {
      return false;
    }
    
    return true;
  }
});

// Brotli compression middleware
const brotliMiddleware = (req, res, next) => {
  if (req.headers['accept-encoding']?.includes('br')) {
    const originalSend = res.send;
    res.send = function(data) {
      if (Buffer.isBuffer(data)) {
        brotli.compress(data, { quality: 11 }, (err, compressed) => {
          if (err) {
            return originalSend.call(this, data);
          }
          res.setHeader('Content-Encoding', 'br');
          res.setHeader('Content-Length', compressed.length);
          originalSend.call(this, compressed);
        });
      } else {
        originalSend.call(this, data);
      }
    };
  }
  next();
};

// Gzip compression middleware
const gzipMiddleware = (req, res, next) => {
  if (req.headers['accept-encoding']?.includes('gzip')) {
    const originalSend = res.send;
    res.send = function(data) {
      if (Buffer.isBuffer(data)) {
        zlib.gzip(data, { level: 9 }, (err, compressed) => {
          if (err) {
            return originalSend.call(this, data);
          }
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Length', compressed.length);
          originalSend.call(this, compressed);
        });
      } else {
        originalSend.call(this, data);
      }
    };
  }
  next();
};

// Static file compression middleware
const staticFileCompression = (req, res, next) => {
  const filePath = req.path;
  const contentType = res.getHeader('Content-Type');
  
  // Check if file exists and is compressible
  if (contentType && 
      (contentType.includes('text/') || 
       contentType.includes('application/json') || 
       contentType.includes('application/javascript') || 
       contentType.includes('application/xml'))) {
    
    // Check for pre-compressed files
    const brotliPath = `${filePath}.br`;
    const gzipPath = `${filePath}.gz`;
    
    // Serve pre-compressed file if exists
    if (req.headers['accept-encoding']?.includes('br') && fs.existsSync(brotliPath)) {
      res.setHeader('Content-Encoding', 'br');
      res.sendFile(brotliPath);
      return;
    }
    
    if (req.headers['accept-encoding']?.includes('gzip') && fs.existsSync(gzipPath)) {
      res.setHeader('Content-Encoding', 'gzip');
      res.sendFile(gzipPath);
      return;
    }
  }
  next();
};

// Image optimization middleware
const imageOptimization = (req, res, next) => {
  const contentType = res.getHeader('Content-Type');
  if (contentType && contentType.includes('image/')) {
    const originalSend = res.send;
    res.send = function(data) {
      if (Buffer.isBuffer(data)) {
        optimizeImage(data, contentType, (err, optimized) => {
          if (err) {
            return originalSend.call(this, data);
          }
          res.setHeader('Content-Length', optimized.length);
          originalSend.call(this, optimized);
        });
      } else {
        originalSend.call(this, data);
      }
    };
  }
  next();
};

// Cleanup compressed files
const cleanupCompressedFiles = () => {
  setInterval(() => {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours ago
    
    const compressedFiles = fs.readdirSync('compressed');
    compressedFiles.forEach(file => {
      const filePath = path.join('compressed', file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
      }
    });
  }, 60 * 60 * 1000); // Run cleanup every hour
};

module.exports = {
  compressionMiddleware,
  brotliMiddleware,
  gzipMiddleware,
  staticFileCompression,
  imageOptimization,
  cleanupCompressedFiles
};

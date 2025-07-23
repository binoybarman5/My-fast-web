const cacheControl = (req, res, next) => {
  // Set cache control for static assets
  if (req.path.startsWith('/uploads/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
  // Set cache control for API responses
  else if (req.path.startsWith('/api/')) {
    // Cache API responses for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    // Add ETag for cache validation
    const etag = generateETag(req.path);
    res.setHeader('ETag', etag);
    
    // Handle If-None-Match header
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      res.status(304).end();
      return;
    }
  }
  next();
};

// Generate ETag based on request path and timestamp
const generateETag = (path) => {
  const timestamp = Date.now();
  return `W/"${Buffer.from(path + timestamp).toString('base64')}"`;
};

module.exports = cacheControl;

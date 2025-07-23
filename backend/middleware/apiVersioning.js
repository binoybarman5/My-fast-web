const apiVersioning = (req, res, next) => {
  // Get API version from Accept header or query parameter
  const headerVersion = req.headers['accept-version'];
  const queryVersion = req.query.version;
  
  // Determine version to use
  let version = '1.0';
  if (headerVersion) {
    version = headerVersion;
  } else if (queryVersion) {
    version = queryVersion;
  }
  
  // Store version in request
  req.apiVersion = version;
  
  // Add version to response headers
  res.setHeader('X-API-Version', version);
  
  next();
};

module.exports = apiVersioning;

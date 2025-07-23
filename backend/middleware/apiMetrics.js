const promClient = require('prom-client');

// Create Prometheus metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_microseconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000, 5000, 10000, 30000, 60000]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeRequests = new promClient.Gauge({
  name: 'active_requests',
  help: 'Number of active requests being processed'
});

const requestSizeBytes = new promClient.Summary({
  name: 'request_size_bytes',
  help: 'Size of HTTP requests in bytes'
});

const responseSizeBytes = new promClient.Summary({
  name: 'response_size_bytes',
  help: 'Size of HTTP responses in bytes'
});

// API metrics middleware
const apiMetrics = (req, res, next) => {
  try {
    // Track active requests
    activeRequests.inc();
    
    // Start timer
    const start = Date.now();
    
    // Track request size
    const reqSize = Buffer.byteLength(JSON.stringify(req.body));
    requestSizeBytes.observe(reqSize);
    
    // Store response size
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      // Track response size
      const resSize = Buffer.byteLength(chunk || '');
      responseSizeBytes.observe(resSize);
      
      // Calculate duration
      const duration = Date.now() - start;
      
      // Update metrics
      httpRequestDurationMicroseconds.labels(req.method, req.originalUrl, res.statusCode).observe(duration);
      httpRequestsTotal.labels(req.method, req.originalUrl, res.statusCode).inc();
      
      // Update active requests
      activeRequests.dec();
      
      // Call original end method
      originalEnd.apply(this, arguments);
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Metrics endpoint
const metricsEndpoint = (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
};

// Metrics registry cleanup
const cleanupMetrics = () => {
  // Reset metrics periodically to prevent memory leaks
  setInterval(() => {
    promClient.register.resetMetrics();
  }, 24 * 60 * 60 * 1000); // Reset every 24 hours
};

module.exports = {
  apiMetrics,
  metricsEndpoint,
  cleanupMetrics
};

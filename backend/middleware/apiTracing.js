const opentracing = require('opentracing');
const tracer = require('jaeger-client').initTracer({
  serviceName: 'small-jobs-api',
  sampler: {
    type: 'const',
    param: 1
  },
  reporter: {
    logSpans: true
  }
});

// API tracing middleware
const apiTracing = (req, res, next) => {
  try {
    // Extract parent span context from headers
    const parentSpanContext = tracer.extract(
      opentracing.FORMAT_HTTP_HEADERS,
      req.headers
    );
    
    // Create new span
    const span = tracer.startSpan(req.originalUrl, {
      childOf: parentSpanContext,
      tags: {
        'http.method': req.method,
        'http.url': req.originalUrl,
        'http.path': req.path,
        'http.query': JSON.stringify(req.query)
      }
    });
    
    // Store span in request object
    req.span = span;
    
    // Inject span context into response headers
    tracer.inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, res.headers);
    
    // Track request body
    if (req.body) {
      span.setTag('http.request_body', JSON.stringify(req.body));
    }
    
    // Track response
    res.on('finish', () => {
      span.setTag('http.status_code', res.statusCode);
      span.setTag('http.response_body', JSON.stringify(res._getData ? res._getData() : res._body));
      span.finish();
    });
    
    next();
  } catch (error) {
    if (req.span) {
      req.span.setTag('error', true);
      req.span.setTag('error.message', error.message);
      req.span.finish();
    }
    next(error);
  }
};

// Create child span for sub-operations
const createChildSpan = (req, operationName, tags = {}) => {
  return tracer.startSpan(operationName, {
    childOf: req.span,
    tags: {
      ...tags,
      'component': 'api'
    }
  });
};

// Close tracer when server shuts down
const closeTracer = () => {
  tracer.close();
};

module.exports = {
  apiTracing,
  createChildSpan,
  closeTracer
};

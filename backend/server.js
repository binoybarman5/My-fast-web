require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('./middleware/cors');
const morgan = require('morgan');
const { logger, errorLogger } = require('./middleware/logger');
const { apiLimiter, loginLimiter, jobPostLimiter, speedLimiter, searchLimiter } = require('./middleware/apiRateLimit');
const errorHandler = require('./middleware/errorHandler');
const compress = require('./middleware/compression');
const securityHeaders = require('./middleware/securityHeaders');
const apiVersioning = require('./middleware/apiVersioning');
const { staticFiles, compressStatic } = require('./middleware/staticFiles');
const { apiLogger, errorLogger: apiErrorLogger } = require('./middleware/apiLogger');
const { cache, invalidateCache } = require('./middleware/apiCache');
const { validate: validateBasic, validateJobCreation, validateUserRegistration } = require('./middleware/advancedValidation');
const { apiAnalytics, aggregateAnalytics } = require('./middleware/apiAnalytics');
const { apiMetrics, metricsEndpoint, cleanupMetrics } = require('./middleware/apiMetrics');
const { apiTracing, createChildSpan, closeTracer } = require('./middleware/apiTracing');
const { apiMonitoring, initializeMonitoring } = require('./middleware/apiMonitoring');
const healthCheck = require('./middleware/apiHealthCheck');
const { audit, initializeAuditLogging } = require('./middleware/apiAudit');
const { configureSecurity } = require('./middleware/apiSecurity');
const { apiThrottling, cleanupExpiredKeys } = require('./middleware/apiThrottling');
const { compressionMiddleware, brotliMiddleware, gzipMiddleware, staticFileCompression, imageOptimization, cleanupCompressedFiles } = require('./middleware/apiCompression');
const { 
  ApiError,
  validationErrorHandler,
  duplicateKeyErrorHandler,
  jwtErrorHandler,
  rateLimitErrorHandler,
  databaseErrorHandler,
  networkErrorHandler,
  errorHandler: apiErrorHandler,
  errorLogger: apiErrorLogger,
  errorMonitoring
} = require('./middleware/apiErrorHandling');
const { logger: winstonLogger, morganLogger, expressLogger, expressErrorLogger, requestLogger, responseLogger, accessLogger, errorLogger: loggingErrorLogger, cleanupLogs } = require('./middleware/apiLogging');
const { validate: validateAdvanced, fileValidation, bodyValidation, paramValidation, queryValidation } = require('./middleware/apiValidation');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Apply security headers
app.use(securityHeaders.securityHeaders);
app.use(securityHeaders.additionalSecurityHeaders);

// Apply compression
app.use(compress);

// Apply API versioning
app.use(apiVersioning);

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/jobs', jobPostLimiter);
app.use('/api/search', searchLimiter);

// Apply speed limiting
app.use(speedLimiter);

// Apply caching
app.use('/api', cache);

// Apply CORS
app.use(cors);

// Serve static files
app.use('/uploads', compressStatic, staticFiles);

// Configure security
configureSecurity(app);

// Apply compression
app.use(compressionMiddleware);
app.use(brotliMiddleware);
app.use(gzipMiddleware);
app.use(staticFileCompression);
app.use(imageOptimization);

// Apply throttling
app.use(apiThrottling);

// Apply error handling
app.use(validationErrorHandler);
app.use(duplicateKeyErrorHandler);
app.use(jwtErrorHandler);
app.use(rateLimitErrorHandler);
app.use(databaseErrorHandler);
app.use(networkErrorHandler);

// Apply logging
app.use(winstonLogger);
app.use(morganLogger);
app.use(expressLogger);
app.use(requestLogger);
app.use(responseLogger);
app.use(accessLogger);

// Apply validation
app.use(validateBasic);
app.use(validateAdvanced);
app.use(fileValidation);
app.use(bodyValidation);
app.use(paramValidation);
app.use(queryValidation);

// Apply analytics, metrics, tracing, monitoring, audit logging, security, throttling, compression, and error handling
app.use(apiAnalytics);
app.use(apiMetrics);
app.use(apiTracing);
app.use(apiMonitoring);
app.use(audit);

// Start monitoring, metrics cleanup, audit logging, throttling cleanup, compression cleanup, error monitoring, and log cleanup
initializeMonitoring();
cleanupMetrics();
initializeAuditLogging();
cleanupExpiredKeys();
cleanupCompressedFiles();
cleanupLogs();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Small Jobs API Documentation',
      version: '1.0.0',
      description: 'API documentation for Small Jobs website',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', validateUserRegistration, require('./routes/auth'));
app.use('/api/jobs', invalidateCache, validateJobCreation, require('./routes/jobs'));

// Health check endpoint
app.get('/health', healthCheck);

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// Error handling middleware
app.use(apiErrorLogger);
app.use(errorLogger);
app.use(errorHandler);

// Close tracer on server shutdown
process.on('SIGTERM', () => {
  closeTracer();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/small-jobs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

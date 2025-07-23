const mongoose = require('mongoose');

// API Analytics Schema
const analyticsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  method: String,
  path: String,
  status: Number,
  responseTime: Number,
  ip: String,
  userAgent: String,
  referrer: String,
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  responseBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  error: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

// Create Analytics model
const Analytics = mongoose.model('Analytics', analyticsSchema);

// API analytics middleware
const apiAnalytics = async (req, res, next) => {
  try {
    const start = Date.now();
    
    // Store request data
    const analyticsData = {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || req.headers.referrer,
      requestBody: req.body
    };
    
    // Store response data after request is finished
    res.on('finish', async () => {
      try {
        analyticsData.status = res.statusCode;
        analyticsData.responseTime = Date.now() - start;
        
        // Only store response body for non-sensitive endpoints
        if (!req.path.startsWith('/api/auth')) {
          analyticsData.responseBody = res._getData ? res._getData() : res._body;
        }
        
        // Store analytics data
        await Analytics.create(analyticsData);
      } catch (error) {
        console.error('Error storing analytics data:', error);
      }
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

// Analytics aggregation middleware
const aggregateAnalytics = async (req, res, next) => {
  try {
    // Get analytics data based on query parameters
    const { startDate, endDate, path, method, status } = req.query;
    
    const query = {};
    if (startDate) query.timestamp = { $gte: new Date(startDate) };
    if (endDate) query.timestamp = { $lte: new Date(endDate) };
    if (path) query.path = path;
    if (method) query.method = method;
    if (status) query.status = parseInt(status);
    
    // Aggregate analytics data
    const analytics = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            path: '$path',
            method: '$method',
            status: '$status'
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      },
      { $sort: { 'count': -1 } }
    ]);
    
    res.json({
      success: true,
      analytics,
      totalRequests: analytics.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  apiAnalytics,
  aggregateAnalytics
};

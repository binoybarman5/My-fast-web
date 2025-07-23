const redis = require('redis');
const { promisify } = require('util');

// Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Promisify Redis commands
const setAsync = promisify(redisClient.set).bind(redisClient);
const getAsync = promisify(redisClient.get).bind(redisClient);

// Cache middleware
const cache = async (req, res, next) => {
  try {
    // Generate unique cache key based on request details
    const cacheKey = `cache:${req.method}:${req.originalUrl}:${req.query ? JSON.stringify(req.query) : ''}`;
    
    // Check if response is cached
    const cachedResponse = await getAsync(cacheKey);
    
    if (cachedResponse) {
      // Set cache hit headers
      res.setHeader('X-Cache', 'HIT');
      
      // Send cached response
      const { statusCode, headers, body } = JSON.parse(cachedResponse);
      res.writeHead(statusCode, headers);
      res.end(body);
      return;
    }
    
    // Store response in cache
    res.on('finish', async () => {
      const cacheDuration = getCacheDuration(req);
      if (cacheDuration > 0) {
        const response = {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: res._getData ? res._getData() : res._body
        };
        
        await setAsync(cacheKey, JSON.stringify(response), 'EX', cacheDuration);
      }
    });
    
    // Set cache miss header
    res.setHeader('X-Cache', 'MISS');
    
    next();
  } catch (error) {
    next(error);
  }
};

// Get cache duration based on request type
const getCacheDuration = (req) => {
  // Cache static assets for 24 hours
  if (req.path.startsWith('/uploads/')) {
    return 86400;
  }
  
  // Cache search results for 5 minutes
  if (req.path.startsWith('/api/search')) {
    return 300;
  }
  
  // Cache job listings for 10 minutes
  if (req.path.startsWith('/api/jobs')) {
    return 600;
  }
  
  // Cache user profiles for 1 hour
  if (req.path.startsWith('/api/users')) {
    return 3600;
  }
  
  // Don't cache other endpoints
  return 0;
};

// Cache invalidation middleware
const invalidateCache = async (req, res, next) => {
  try {
    // Generate cache keys to invalidate based on request details
    const cacheKeys = await generateCacheKeys(req);
    
    // Invalidate cache keys
    await Promise.all(
      cacheKeys.map(key => redisClient.del(key))
    );
    
    next();
  } catch (error) {
    next(error);
  }
};

// Generate cache keys to invalidate
const generateCacheKeys = async (req) => {
  const keys = [];
  
  // Invalidate job-related caches when creating/updating/deleting jobs
  if (req.path.startsWith('/api/jobs')) {
    keys.push('cache:GET:/api/jobs:*');
    keys.push('cache:GET:/api/search:*');
  }
  
  // Invalidate user-related caches when updating user data
  if (req.path.startsWith('/api/users')) {
    keys.push('cache:GET:/api/users:*');
  }
  
  return keys;
};

module.exports = {
  cache,
  invalidateCache
};

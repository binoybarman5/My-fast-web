const Redis = require('ioredis');
const crypto = require('crypto');

// Redis client for rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null
});

// Throttling configuration
const THROTTLING_CONFIG = {
  // Default limits
  default: {
    limit: 100, // requests
    window: 60 * 60 * 1000, // 1 hour
    burst: 10, // burst limit
    burstWindow: 60 * 1000 // 1 minute
  },
  // Role-based limits
  roles: {
    admin: {
      limit: 500,
      window: 60 * 60 * 1000,
      burst: 50,
      burstWindow: 60 * 1000
    },
    premium: {
      limit: 200,
      window: 60 * 60 * 1000,
      burst: 20,
      burstWindow: 60 * 1000
    }
  }
};

// Generate unique key for rate limiting
const generateKey = (req) => {
  const userId = req.user ? req.user._id : 'anonymous';
  const ip = req.ip;
  const path = req.path;
  return `throttle:${userId}:${ip}:${path}`;
};

// Generate burst key for rate limiting
const generateBurstKey = (req) => {
  const userId = req.user ? req.user._id : 'anonymous';
  const ip = req.ip;
  const path = req.path;
  return `throttle-burst:${userId}:${ip}:${path}`;
};

// Get throttling configuration for user role
const getThrottlingConfig = (req) => {
  const role = req.user ? req.user.role : 'default';
  return THROTTLING_CONFIG.roles[role] || THROTTLING_CONFIG.default;
};

// Throttling middleware
const apiThrottling = async (req, res, next) => {
  try {
    // Get throttling configuration
    const config = getThrottlingConfig(req);
    
    // Generate keys
    const key = generateKey(req);
    const burstKey = generateBurstKey(req);
    
    // Check burst limit
    const [burstCount, burstTTL] = await redis.multi()
      .incr(burstKey)
      .pttl(burstKey)
      .exec();
    
    // Reset burst counter if TTL is negative
    if (burstTTL < 0) {
      await redis.set(burstKey, 1, 'PX', config.burstWindow);
    }
    
    // Check burst limit
    if (burstCount > config.burst) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        type: 'burst'
      });
    }
    
    // Check regular limit
    const [count, ttl] = await redis.multi()
      .incr(key)
      .pttl(key)
      .exec();
    
    // Reset counter if TTL is negative
    if (ttl < 0) {
      await redis.set(key, 1, 'PX', config.window);
    }
    
    // Check limit
    if (count > config.limit) {
      return res.status(429).json({
        message: 'Rate limit exceeded. Please try again later.',
        type: 'regular'
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.limit);
    res.setHeader('X-RateLimit-Remaining', config.limit - count);
    res.setHeader('X-RateLimit-Reset', Math.floor((ttl + Date.now()) / 1000));
    
    // Add burst limit headers
    res.setHeader('X-RateLimit-Burst', config.burst);
    res.setHeader('X-RateLimit-Burst-Remaining', config.burst - burstCount);
    res.setHeader('X-RateLimit-Burst-Reset', Math.floor((burstTTL + Date.now()) / 1000));
    
    next();
  } catch (error) {
    console.error('Error in throttling middleware:', error);
    next();
  }
};

// Whitelist middleware
const whitelist = (req, res, next) => {
  const whitelist = process.env.WHITELIST_IPS?.split(',') || [];
  if (whitelist.includes(req.ip)) {
    return next();
  }
  next();
};

// API key validation middleware
const apiKeyValidation = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      message: 'API key is required'
    });
  }
  
  // Validate API key
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      message: 'Invalid API key'
    });
  }
  
  next();
};

// IP geolocation middleware
const ipGeolocation = async (req, res, next) => {
  try {
    // Get geolocation data (you would typically use an IP geolocation service here)
    const geoData = await getGeoData(req.ip);
    req.geo = geoData;
    next();
  } catch (error) {
    console.error('Error getting geolocation data:', error);
    next();
  }
};

// IP reputation check middleware
const ipReputationCheck = async (req, res, next) => {
  try {
    // Check IP reputation (you would typically use an IP reputation service here)
    const reputation = await checkReputation(req.ip);
    if (reputation.score < 0) {
      return res.status(403).json({
        message: 'Access denied due to suspicious IP reputation'
      });
    }
    next();
  } catch (error) {
    console.error('Error checking IP reputation:', error);
    next();
  }
};

// Cleanup expired keys
const cleanupExpiredKeys = () => {
  setInterval(async () => {
    try {
      await redis.keys('throttle:*').then(keys => {
        if (keys.length > 0) {
          redis.del(keys);
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired keys:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run cleanup every 24 hours
};

module.exports = {
  apiThrottling,
  whitelist,
  apiKeyValidation,
  ipGeolocation,
  ipReputationCheck,
  cleanupExpiredKeys
};

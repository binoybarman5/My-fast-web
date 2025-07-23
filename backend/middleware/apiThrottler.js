const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { promisify } = require('util');
const redis = require('redis');

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

// Rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new rateLimit.RedisStore({
    client: redisClient,
    prefix: 'ratelimit'
  })
});

// Slow down requests after 50 requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests without delay
  delayMs: 500, // delay subsequent requests by 500ms
  store: new slowDown.RedisStore({
    client: redisClient,
    prefix: 'slowdown'
  })
});

// Throttle requests based on user role
const roleThrottler = async (req, res, next) => {
  try {
    // Get user role from token or request
    const role = req.user?.role || 'guest';
    
    // Define rate limits based on role
    const limits = {
      admin: { max: 200, windowMs: 15 * 60 * 1000 }, // 200 requests per 15 minutes
      premium: { max: 150, windowMs: 15 * 60 * 1000 }, // 150 requests per 15 minutes
      user: { max: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
      guest: { max: 50, windowMs: 15 * 60 * 1000 } // 50 requests per 15 minutes
    };
    
    const limit = limits[role] || limits.guest;
    
    // Generate unique key for this request
    const key = `throttle:${role}:${req.ip}`;
    
    // Get current count
    const count = await getAsync(key);
    
    if (count) {
      const currentCount = parseInt(count);
      if (currentCount >= limit.max) {
        return res.status(429).json({
          success: false,
          message: `Rate limit exceeded for ${role} users. Please try again later.`
        });
      }
      
      // Increment count
      await setAsync(key, currentCount + 1, 'EX', Math.floor(limit.windowMs / 1000));
    } else {
      // Set initial count
      await setAsync(key, 1, 'EX', Math.floor(limit.windowMs / 1000));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  apiLimiter,
  speedLimiter,
  roleThrottler
};

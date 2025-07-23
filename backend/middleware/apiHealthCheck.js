const healthCheck = (req, res, next) => {
  try {
    // Check MongoDB connection
    const checkMongo = new Promise((resolve, reject) => {
      mongoose.connection.on('error', reject);
      mongoose.connection.once('open', () => resolve({ status: 'healthy', message: 'MongoDB connection is healthy' }));
    });

    // Check Redis connection
    const checkRedis = new Promise((resolve, reject) => {
      redisClient.ping((error, reply) => {
        if (error) reject(error);
        resolve({ status: 'healthy', message: 'Redis connection is healthy' });
      });
    });

    // Check Elasticsearch connection
    const checkElastic = esClient.cluster.health().then(
      () => ({ status: 'healthy', message: 'Elasticsearch cluster is healthy' }),
      error => ({ status: 'unhealthy', message: error.message })
    );

    // Check Redis cache
    const checkCache = redisClient.get('test-key').then(
      () => ({ status: 'healthy', message: 'Redis cache is working' }),
      error => ({ status: 'unhealthy', message: error.message })
    );

    // Check database query
    const checkDb = mongoose.model('User').findOne({}).then(
      () => ({ status: 'healthy', message: 'Database query is working' }),
      error => ({ status: 'unhealthy', message: error.message })
    );

    // Check API response time
    const checkResponseTime = () => {
      const start = Date.now();
      return mongoose.model('User').findOne({})
        .then(() => {
          const duration = Date.now() - start;
          return {
            status: duration < 500 ? 'healthy' : 'warning',
            message: `API response time: ${duration}ms`
          };
        })
        .catch(error => ({
          status: 'unhealthy',
          message: error.message
        }));
    };

    // Run all checks in parallel
    Promise.all([
      checkMongo,
      checkRedis,
      checkElastic,
      checkCache,
      checkDb,
      checkResponseTime()
    ])
      .then(results => {
        const status = results.some(r => r.status === 'unhealthy') ? 'unhealthy' :
                      results.some(r => r.status === 'warning') ? 'warning' : 'healthy';

        res.json({
          status,
          timestamp: new Date().toISOString(),
          checks: results
        });
      })
      .catch(error => {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

module.exports = healthCheck;

const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

// Create index template
async function createIndexTemplate() {
  try {
    await esClient.indices.putIndexTemplate({
      name: 'api-monitoring-template',
      body: {
        index_patterns: ['api-monitoring-*'],
        template: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              method: { type: 'keyword' },
              path: { type: 'keyword' },
              status: { type: 'integer' },
              responseTime: { type: 'float' },
              ip: { type: 'ip' },
              userAgent: { type: 'text' },
              requestBody: { type: 'text' },
              responseBody: { type: 'text' },
              error: { type: 'text' }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating index template:', error);
  }
}

// Create daily index
async function createDailyIndex() {
  try {
    const date = new Date().toISOString().split('T')[0];
    const indexName = `api-monitoring-${date}`;
    
    await esClient.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        }
      }
    });
  } catch (error) {
    if (error.meta?.body?.error?.type !== 'index_already_exists_exception') {
      console.error('Error creating daily index:', error);
    }
  }
}

// API monitoring middleware
const apiMonitoring = async (req, res, next) => {
  try {
    const start = Date.now();
    
    // Store request data
    const monitoringData = {
      timestamp: new Date(),
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestBody: req.body
    };
    
    // Store response data after request is finished
    res.on('finish', async () => {
      try {
        monitoringData.status = res.statusCode;
        monitoringData.responseTime = Date.now() - start;
        
        // Only store response body for non-sensitive endpoints
        if (!req.path.startsWith('/api/auth')) {
          monitoringData.responseBody = res._getData ? res._getData() : res._body;
        }
        
        // Store monitoring data
        const date = new Date().toISOString().split('T')[0];
        const indexName = `api-monitoring-${date}`;
        
        await esClient.index({
          index: indexName,
          body: monitoringData
        });
      } catch (error) {
        console.error('Error storing monitoring data:', error);
      }
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

// Initialize monitoring
async function initializeMonitoring() {
  try {
    await createIndexTemplate();
    await createDailyIndex();
  } catch (error) {
    console.error('Error initializing monitoring:', error);
  }
}

module.exports = {
  apiMonitoring,
  initializeMonitoring
};

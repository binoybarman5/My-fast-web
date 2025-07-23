const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');

// Elasticsearch client for audit logs
const auditClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

// Create audit log directory
const auditLogDir = path.join(__dirname, '..', 'logs', 'audit');
if (!fs.existsSync(auditLogDir)) {
  fs.mkdirSync(auditLogDir, { recursive: true });
}

// Audit log schema
const auditLogSchema = {
  timestamp: Date,
  userId: String,
  action: String,
  resource: String,
  resourceId: String,
  ipAddress: String,
  userAgent: String,
  status: String,
  data: Object,
  metadata: Object
};

// Create audit log index template
async function createAuditIndexTemplate() {
  try {
    await auditClient.indices.putIndexTemplate({
      name: 'audit-log-template',
      body: {
        index_patterns: ['audit-log-*'],
        template: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              userId: { type: 'keyword' },
              action: { type: 'keyword' },
              resource: { type: 'keyword' },
              resourceId: { type: 'keyword' },
              ipAddress: { type: 'ip' },
              userAgent: { type: 'text' },
              status: { type: 'keyword' },
              data: { type: 'object', dynamic: true },
              metadata: { type: 'object', dynamic: true }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating audit index template:', error);
  }
}

// Create daily audit log index
async function createDailyAuditIndex() {
  try {
    const date = new Date().toISOString().split('T')[0];
    const indexName = `audit-log-${date}`;
    
    await auditClient.indices.create({
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
      console.error('Error creating daily audit index:', error);
    }
  }
}

// Create audit log file
function createAuditLogFile(userId, action, resource, resourceId, data, metadata) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const fileName = path.join(auditLogDir, `${date}.jsonl`);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      resourceId,
      ipAddress: data?.ipAddress,
      userAgent: data?.userAgent,
      status: data?.status || 'success',
      data: data?.data || {},
      metadata: metadata || {}
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(fileName, logLine);
  } catch (error) {
    console.error('Error writing to audit log file:', error);
  }
}

// Audit middleware
const audit = async (req, res, next) => {
  try {
    // Track request data
    const auditData = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      data: req.body
    };

    // Store audit data after request is finished
    res.on('finish', async () => {
      try {
        // Get user ID from request
        const userId = req.user ? req.user._id : 'anonymous';
        
        // Get action type from request method and path
        const action = `${req.method} ${req.path}`;
        
        // Get resource type from request path
        const resource = req.path.split('/')[2] || 'unknown';
        
        // Get resource ID from request parameters
        const resourceId = req.params.id || req.query.id;
        
        // Create audit log entry
        const auditEntry = {
          userId,
          action,
          resource,
          resourceId,
          status: res.statusCode < 400 ? 'success' : 'failure',
          data: auditData
        };

        // Store in Elasticsearch
        const date = new Date().toISOString().split('T')[0];
        const indexName = `audit-log-${date}`;
        
        await auditClient.index({
          index: indexName,
          body: auditEntry
        });

        // Store in file
        createAuditLogFile(userId, action, resource, resourceId, auditData);
      } catch (error) {
        console.error('Error storing audit log:', error);
      }
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Initialize audit logging
async function initializeAuditLogging() {
  try {
    await createAuditIndexTemplate();
    await createDailyAuditIndex();
  } catch (error) {
    console.error('Error initializing audit logging:', error);
  }
}

module.exports = {
  audit,
  initializeAuditLogging
};

const logger = require("../logger");

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Log incoming request
  logger.info('API Request Started', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer [REDACTED]' : undefined,
      'token': req.headers['token'] ? '[REDACTED]' : undefined,
      'origin': req.headers['origin'],
      'referer': req.headers['referer']
    },
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  });

  // Log request body for POST/PUT/PATCH requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    
    // Remove sensitive fields from logging
    if (sanitizedBody.password) {
      sanitizedBody.password = '[REDACTED]';
    }
    if (sanitizedBody.token) {
      sanitizedBody.token = '[REDACTED]';
    }
    if (sanitizedBody.secret) {
      sanitizedBody.secret = '[REDACTED]';
    }
    
    logger.info('API Request Body', {
      requestId,
      body: sanitizedBody,
      bodySize: JSON.stringify(req.body).length
    });
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.info('API Request Completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: chunk ? chunk.length : 0,
      timestamp: new Date().toISOString()
    });

    // Log error responses with more detail
    if (res.statusCode >= 400) {
      logger.error('API Request Error', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        error: res.statusMessage || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;

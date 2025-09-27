// scripts/health-check.js
// Script de health check para Docker e PM2

import http from 'http';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 1337,
  path: '/monitoring/health',
  method: 'GET',
  timeout: 5000
};

const healthCheck = () => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          
          // Verificar se o status é healthy
          if (health.status === 'healthy') {
            console.log('✅ Health check passed:', health.status);
            resolve(true);
          } else {
            console.log('❌ Health check failed: status is not healthy');
            reject(new Error('Service is not healthy'));
          }
        } catch (error) {
          console.log('❌ Health check failed: invalid JSON response');
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Health check failed: connection error');
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('❌ Health check failed: timeout');
      req.destroy();
      reject(new Error('Health check timeout'));
    });
    
    req.setTimeout(5000);
    req.end();
  });
};

// Executar health check
healthCheck()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Health check failed:', error.message);
    process.exit(1);
  });
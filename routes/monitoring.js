// routes/monitoring.js

import express from 'express';
import statsService from '../services/statsService.js';
import logger from '../config/logger.js';

const router = express.Router();

// Endpoint de health check
router.get('/health', async (req, res) => {
  try {
    const health = await statsService.getHealthStatus();
    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de estatísticas
router.get('/stats', async (req, res) => {
  try {
    const stats = await statsService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Stats retrieval failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de estatísticas das últimas 24h
router.get('/stats/24h', async (req, res) => {
  try {
    const stats = await statsService.getLast24hStats();
    res.json(stats);
  } catch (error) {
    logger.error('24h stats retrieval failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve 24h statistics',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de reset de estatísticas (apenas para desenvolvimento)
router.post('/stats/reset', async (req, res) => {
  try {
    // Verificar se é ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Reset not allowed in production',
        timestamp: new Date().toISOString()
      });
    }
    
    // Reset manual das estatísticas
    statsService.resetDailyStats();
    
    logger.info('Manual stats reset performed');
    res.json({
      message: 'Statistics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Stats reset failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to reset statistics',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;


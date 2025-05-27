const CircuitBreaker = require('opossum');
const logger = require('../utils/logger');
const config = require('../config/config');

class CircuitBreakerService {
  constructor() {
    this.breakers = new Map();
    this.setupBreakers();
  }

  setupBreakers() {
    // Redis circuit breaker
    this.createBreaker('redis', {
      timeout: config.circuitBreaker.timeout,
      errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage,
      resetTimeout: config.circuitBreaker.resetTimeout,
      name: 'Redis Operations'
    });

    // File system circuit breaker
    this.createBreaker('filesystem', {
      timeout: 5000,
      errorThresholdPercentage: 60,
      resetTimeout: 30000,
      name: 'File System Operations'
    });

    // External API circuit breaker
    this.createBreaker('external_api', {
      timeout: 10000,
      errorThresholdPercentage: 40,
      resetTimeout: 60000,
      name: 'External API Calls'
    });
  }

  createBreaker(name, options) {
    const breaker = new CircuitBreaker(this.executeWithFallback.bind(this), options);

    // Event listeners
    breaker.on('open', () => {
      logger.warn(`Circuit breaker opened: ${options.name}`, { breaker: name });
    });

    breaker.on('halfOpen', () => {
      logger.info(`Circuit breaker half-open: ${options.name}`, { breaker: name });
    });

    breaker.on('close', () => {
      logger.info(`Circuit breaker closed: ${options.name}`, { breaker: name });
    });

    breaker.on('fallback', (result) => {
      logger.warn(`Circuit breaker fallback triggered: ${options.name}`, { 
        breaker: name,
        fallback: result 
      });
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  async executeWithFallback(operation, fallback = null) {
    try {
      return await operation();
    } catch (error) {
      logger.error('Circuit breaker operation failed', { error: error.message });
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  // Execute operation through circuit breaker
  async execute(breakerName, operation, fallback = null) {
    const breaker = this.breakers.get(breakerName);
    if (!breaker) {
      logger.error('Circuit breaker not found', { breakerName });
      return operation();
    }

    try {
      return await breaker.fire(operation, fallback);
    } catch (error) {
      logger.error('Circuit breaker execution failed', { 
        breakerName, 
        error: error.message 
      });
      
      // Return fallback if available
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  // Get circuit breaker status
  getStatus(breakerName) {
    const breaker = this.breakers.get(breakerName);
    if (!breaker) return null;

    return {
      name: breakerName,
      state: breaker.state,
      isOpen: breaker.opened,
      stats: breaker.stats
    };
  }

  // Get all circuit breaker statuses
  getAllStatus() {
    const statuses = {};
    for (const [name, breaker] of this.breakers) {
      statuses[name] = {
        state: breaker.state,
        isOpen: breaker.opened,
        stats: breaker.stats
      };
    }
    return statuses;
  }

  // Reset circuit breaker
  reset(breakerName) {
    const breaker = this.breakers.get(breakerName);
    if (breaker) {
      breaker.close();
      logger.info('Circuit breaker reset', { breakerName });
    }
  }

  // Reset all circuit breakers
  resetAll() {
    for (const [name, breaker] of this.breakers) {
      breaker.close();
      logger.info('Circuit breaker reset', { breakerName: name });
    }
  }

  // Get stats for all circuit breakers
  getStats() {
    const stats = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = {
        state: breaker.state,
        isOpen: breaker.opened,
        stats: {
          fires: breaker.stats.fires,
          successes: breaker.stats.successes,
          failures: breaker.stats.failures,
          rejects: breaker.stats.rejects,
          timeouts: breaker.stats.timeouts
        }
      };
    }
    return stats;
  }
}

module.exports = new CircuitBreakerService();

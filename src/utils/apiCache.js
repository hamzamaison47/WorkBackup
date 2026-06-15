/**
 * API Response Caching System
 * Reduces unnecessary API calls and improves app performance
 */

class APICache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Generate cache key from request parameters
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   * @returns {string} - Unique cache key
   */
  generateKey(endpoint, params = {}) {
    const paramString = JSON.stringify(params);
    return `${endpoint}:${paramString}`;
  }

  /**
   * Set cache with TTL (Time To Live)
   * @param {string} endpoint - API endpoint
   * @param {object} data - Response data
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   * @param {object} params - Request parameters
   */
  set(endpoint, data, ttl = 5 * 60 * 1000, params = {}) {
    const key = this.generateKey(endpoint, params);

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store data
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Get cached data if still valid
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   * @returns {object|null} - Cached data or null
   */
  get(endpoint, params = {}) {
    const key = this.generateKey(endpoint, params);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const {data, timestamp, ttl} = cached;
    const now = Date.now();

    // Check if cache has expired
    if (now - timestamp > ttl) {
      this.cache.delete(key);
      this.timers.delete(key);
      return null;
    }

    return data;
  }

  /**
   * Check if data exists in cache
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   * @returns {boolean}
   */
  has(endpoint, params = {}) {
    const key = this.generateKey(endpoint, params);
    const cached = this.cache.get(key);

    if (!cached) {
      return false;
    }

    const {timestamp, ttl} = cached;
    return Date.now() - timestamp <= ttl;
  }

  /**
   * Invalidate specific cache entry
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   */
  invalidate(endpoint, params = {}) {
    const key = this.generateKey(endpoint, params);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries for an endpoint
   * @param {string} endpoint - API endpoint
   */
  clearEndpoint(endpoint) {
    const keysToDelete = [];
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${endpoint}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      this.cache.delete(key);
    });
  }

  /**
   * Clear all cached data
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache size (for debugging)
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {object}
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

/**
 * Hook to use API cache with TTL
 * Usage: const cachedData = useCachedAPI('endpoint', params, 5 * 60 * 1000);
 */
export const useCachedAPI = (endpoint, params = {}, ttl = 5 * 60 * 1000) => {
  return apiCache.get(endpoint, params);
};

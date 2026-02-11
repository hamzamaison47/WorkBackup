/**
 * Optimized Axios Interceptor with Request Caching
 * Automatically caches GET requests to reduce API calls
 */

import axios from 'axios';
import {apiCache} from './apiCache';

// Default cache config (in milliseconds)
const DEFAULT_CACHE_TTL = {
  short: 2 * 60 * 1000, // 2 minutes - for frequently changing data
  medium: 5 * 60 * 1000, // 5 minutes - default
  long: 15 * 60 * 1000, // 15 minutes - for static data
  veryLong: 60 * 60 * 1000, // 1 hour - for rarely changing data
};

// Define which endpoints should be cached and with what TTL
const CACHE_CONFIG = {
  // Profile data - cache for 15 minutes
  profilepicture: DEFAULT_CACHE_TTL.long,

  // Employee data - cache for 15 minutes
  employee: DEFAULT_CACHE_TTL.long,

  // Attendance - cache for 5 minutes
  attendance: DEFAULT_CACHE_TTL.medium,

  // Leave entitlements - cache for 15 minutes (rarely changes)
  leaveentitlement: DEFAULT_CACHE_TTL.long,

  // Leave requests - cache for 5 minutes
  leaverequests: DEFAULT_CACHE_TTL.medium,

  // Dashboard data - cache for 2 minutes (changes frequently)
  dashboard: DEFAULT_CACHE_TTL.short,

  // Default for any GET request not listed above
  default: DEFAULT_CACHE_TTL.medium,
};

/**
 * Get cache TTL based on endpoint
 */
const getCacheTTL = url => {
  const urlLower = url.toLowerCase();

  for (const [key, ttl] of Object.entries(CACHE_CONFIG)) {
    if (key !== 'default' && urlLower.includes(key)) {
      return ttl;
    }
  }

  return CACHE_CONFIG.default;
};

/**
 * Create axios instance with caching interceptor
 */
export const createCachedAxiosInstance = (baseConfig = {}) => {
  const instance = axios.create(baseConfig);

  // Request interceptor - add request timestamp
  instance.interceptors.request.use(
    config => {
      config.requestTime = Date.now();
      return config;
    },
    error => Promise.reject(error),
  );

  // Response interceptor - cache GET requests
  instance.interceptors.response.use(
    response => {
      const {config, data} = response;
      const duration = Date.now() - config.requestTime;

      // Only cache successful GET requests
      if (config.method === 'get' && response.status === 200) {
        const ttl = getCacheTTL(config.url);
        const params = config.params || {};

        apiCache.set(config.url, data, ttl, params);

        // Log slow requests
        if (duration > 500) {
          console.warn(
            `⚠️ Slow API request: ${config.method.toUpperCase()} ${
              config.url
            } (${duration}ms)`,
          );
        }
      }

      return response;
    },
    error => {
      // For errors, check if we have cached data to return
      if (error.config?.method === 'get' && error.response?.status !== 401) {
        const cachedData = apiCache.get(
          error.config.url,
          error.config.params || {},
        );

        if (cachedData) {
          console.log(
            `📦 Using cached data for ${error.config.url} due to network error`,
          );
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (from cache)',
            headers: error.response?.headers || {},
            config: error.config,
          });
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

/**
 * Utility function to make cached GET requests
 */
export const getCachedData = async (
  axiosInstance,
  url,
  params = {},
  force = false,
) => {
  try {
    // Check cache first unless force refresh
    if (!force) {
      const cached = apiCache.get(url, params);
      if (cached) {
        console.log(`✅ Using cached data for ${url}`);
        return cached;
      }
    }

    // Make the request
    const response = await axiosInstance.get(url, {params});
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

/**
 * Clear cache for a specific endpoint
 */
export const clearApiCache = endpoint => {
  apiCache.clearEndpoint(endpoint);
  console.log(`✅ Cache cleared for ${endpoint}`);
};

/**
 * Get current cache stats
 */
export const getApiCacheStats = () => {
  return apiCache.getStats();
};

/**
 * Custom hook for using cached API calls in React components
 * Usage: const data = useCachedFetch(axiosInstance, '/api/employee', params);
 */
export const useCachedFetch = (
  axiosInstance,
  url,
  params = {},
  dependencies = [],
) => {
  const React = require('react');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getCachedData(axiosInstance, url, params);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosInstance, url, JSON.stringify(params), ...dependencies]);

  return {data, loading, error};
};

export default {
  createCachedAxiosInstance,
  getCachedData,
  clearApiCache,
  getApiCacheStats,
  useCachedFetch,
};

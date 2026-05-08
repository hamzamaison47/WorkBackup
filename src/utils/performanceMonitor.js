/**
 * Performance Monitoring Utility
 * Tracks render times, API call times, and memory usage
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = true;
  }

  /**
   * Start measuring performance for a component/function
   * @param {string} label - Unique identifier for this measurement
   */
  startMeasure(label) {
    if (!this.isEnabled) {
      return;
    }
    this.metrics.set(label, {
      startTime: Date.now(),
      startMemory: this.getMemoryUsage(),
    });
  }

  /**
   * End measuring and log results
   * @param {string} label - Same label used in startMeasure
   */
  endMeasure(label) {
    if (!this.isEnabled) {
      return;
    }

    const metric = this.metrics.get(label);
    if (!metric) {
      console.warn(`No start measurement found for label: ${label}`);
      return;
    }

    const duration = Date.now() - metric.startTime;
    const memoryUsed = this.getMemoryUsage() - metric.startMemory;

    // Log slow operations (> 1000ms)
    if (duration > 1000) {
      console.warn(
        `⚠️ SLOW: ${label} took ${duration}ms (Memory: ${this.formatBytes(
          memoryUsed,
        )})`,
      );
    } else {
      console.log(
        `✅ ${label} took ${duration}ms (Memory: ${this.formatBytes(
          memoryUsed,
        )})`,
      );
    }

    this.metrics.delete(label);
    return duration;
  }

  /**
   * Get current memory usage (approximate)
   * @returns {number}
   */
  getMemoryUsage() {
    // Approximation - React Native doesn't expose precise memory info
    // This is a placeholder for better tracking on Android/iOS
    return 0;
  }

  /**
   * Format bytes to readable format
   * @param {number} bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Measure render time in a component
   * Usage in useEffect or component:
   * const end = benchmark('ComponentName');
   * return () => end();
   */
  benchmark(componentName) {
    this.startMeasure(`render-${componentName}`);
    return () => this.endMeasure(`render-${componentName}`);
  }

  /**
   * Measure async operations
   */
  async measureAsync(label, asyncFn) {
    this.startMeasure(label);
    try {
      const result = await asyncFn();
      this.endMeasure(label);
      return result;
    } catch (error) {
      console.error(`Error in ${label}:`, error);
      this.endMeasure(label);
      throw error;
    }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Get all active metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook for measuring component render time
 * Usage: useMeasureRender('ComponentName');
 */
export const useMeasureRender = componentName => {
  const React = require('react');
  React.useEffect(() => {
    const end = performanceMonitor.benchmark(componentName);
    return end;
  }, [componentName]);
};

/**
 * HOC to wrap component with performance monitoring
 */
export const withPerformanceMonitoring = (Component, componentName) => {
  const Name = componentName || Component.displayName || Component.name;
  const Wrapped = props => {
    useMeasureRender(Name);
    return Component(props);
  };
  Wrapped.displayName = `withPerformanceMonitoring(${Name})`;
  return Wrapped;
};

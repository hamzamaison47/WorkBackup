/**
 * Component Optimization Utilities
 * Utilities for memoizing components and preventing unnecessary re-renders
 */

import React, {memo, useMemo, useCallback} from 'react';

/**
 * Enhanced memo that also compares props deeply
 * Useful for list items and complex components
 */
export const deepMemo = (Component, propsAreEqual = null) => {
  return memo(Component, (prevProps, nextProps) => {
    if (propsAreEqual) {
      return propsAreEqual(prevProps, nextProps);
    }

    // Default deep comparison
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        // Deep compare objects
        if (
          typeof prevProps[key] === 'object' &&
          JSON.stringify(prevProps[key]) !== JSON.stringify(nextProps[key])
        ) {
          return false;
        }
        return false;
      }
    }

    return true;
  });
};

/**
 * Create a memoized list item component
 * Usage:
 * const ListItemComponent = createMemoListItem(({item, onPress}) => (
 *   <TouchableOpacity onPress={onPress}>
 *     <Text>{item.name}</Text>
 *   </TouchableOpacity>
 * ));
 */
export const createMemoListItem = ListItemComponent => {
  return memo(ListItemComponent, (prevProps, nextProps) => {
    // Only re-render if the item or the key callback changed
    return (
      prevProps.item?.id === nextProps.item?.id &&
      prevProps.onPress === nextProps.onPress
    );
  });
};

/**
 * Optimize expensive computations
 * Usage:
 * const expensiveValue = useMemoComputation(
 *   () => complexCalculation(data),
 *   [data]
 * );
 */
export const useMemoComputation = (fn, deps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(fn, deps);
};

/**
 * Create stable callback that doesn't trigger re-renders
 * Usage:
 * const handlePress = useStableCallback((id) => {
 *   navigate('Screen', {id});
 * }, [navigate]);
 */
export const useStableCallback = (fn, deps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(fn, deps);
};

/**
 * Memoize a selector from Redux
 * Usage:
 * const userName = useMemoSelector(
 *   state => state.user.name,
 *   (prevValue, nextValue) => prevValue === nextValue
 * );
 */
export const useMemoSelector = (selector, isEqual = (a, b) => a === b) => {
  const React = require('react');
  const {useSelector} = require('react-redux');
  const [memoValue, setMemoValue] = React.useState(null);

  const selectorResult = useSelector(selector);

  React.useEffect(() => {
    if (!isEqual(memoValue, selectorResult)) {
      setMemoValue(selectorResult);
    }
  }, [selectorResult, isEqual, memoValue]);

  return memoValue;
};

/**
 * Debounce a callback function
 * Useful for search, resize, scroll events
 * Usage:
 * const debouncedSearch = useDebounceCallback(
 *   (query) => searchItems(query),
 *   300,
 *   [searchItems]
 * );
 */
export const useDebounceCallback = (callback, delay = 300, deps = []) => {
  const React = require('react');
  const timeoutRef = React.useRef(null);

  return React.useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, ...deps],
  );
};

/**
 * Throttle a callback function
 * Limits how often a function can be called
 * Usage:
 * const throttledScroll = useThrottleCallback(
 *   () => loadMore(),
 *   500,
 *   [loadMore]
 * );
 */
export const useThrottleCallback = (callback, delay = 300, deps = []) => {
  const React = require('react');
  const lastCallRef = React.useRef(0);

  return React.useCallback(
    (...args) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, ...deps],
  );
};

/**
 * Memoize data from props
 * Prevents object recreation on every render
 * Usage:
 * const userData = useMemoProps({name, email, id});
 */
export const useMemoProps = props => {
  return useMemo(() => props, [props]);
};

/**
 * HOC to wrap a component with performance optimization
 * Usage:
 * const OptimizedComponent = withPerformanceOptimization(MyComponent);
 */
export const withPerformanceOptimization = (
  Component,
  displayName = Component.name,
) => {
  const Optimized = memo(Component);
  Optimized.displayName = `optimized(${displayName})`;
  return Optimized;
};

/**
 * Safe state update that checks if component is mounted
 * Usage:
 * const [value, setValue] = useSafeState('initial');
 * // setValue will not cause warnings if component unmounts
 */
export const useSafeState = initialValue => {
  const React = require('react');
  const [state, setState] = React.useState(initialValue);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSafeState = React.useCallback(value => {
    if (isMountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
};

/**
 * Performance-optimized list rendering
 * Prevents re-rendering items that haven't changed
 * Usage: Use with FlatList keyExtractor={() => item.id}
 */
export const getOptimizedListKeyExtractor = () => (item, index) => {
  return item?.id?.toString() || `${index}`;
};

/**
 * Create optimized render item for FlatList
 * Usage:
 * const renderItem = useOptimizedListRender(({item}) => (
 *   <ListItem item={item} />
 * ));
 *
 * <FlatList renderItem={renderItem} ... />
 */
export const useOptimizedListRender = renderFunction => {
  return useCallback(
    ({item, index}) => {
      return renderFunction({item, index});
    },
    [renderFunction],
  );
};

export default {
  deepMemo,
  createMemoListItem,
  useMemoComputation,
  useStableCallback,
  useMemoSelector,
  useDebounceCallback,
  useThrottleCallback,
  useMemoProps,
  withPerformanceOptimization,
  useSafeState,
  getOptimizedListKeyExtractor,
  useOptimizedListRender,
};

/**
 * Lazy Loading Utility for React Navigation
 * Dynamically loads screens to reduce initial bundle size
 */

import React, {Suspense} from 'react';
import {View, ActivityIndicator, Text} from 'react-native';

/**
 * Loading fallback component
 */
const LoadingFallback = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

/**
 * Create lazy-loaded component for navigation
 * Usage: const LazyScreen = lazyLoadScreen(() => import('../screens/MyScreen'));
 *        <Stack.Screen name="MyScreen" component={LazyScreen} />
 */
export const lazyLoadScreen = (importFn, fallback = <LoadingFallback />) => {
  const LazyComponent = React.lazy(importFn);

  return props => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Pre-load a screen before navigation
 * Use this to load screens before user navigates to them
 * Usage: preloadScreen(() => import('../screens/MyScreen'))
 */
export const preloadScreen = async importFn => {
  try {
    await importFn();
    console.log('✅ Screen preloaded successfully');
  } catch (error) {
    console.error('❌ Error preloading screen:', error);
  }
};

/**
 * Create lazy-loaded component with error boundary
 */
export const lazyLoadScreenWithErrorBoundary = (
  importFn,
  fallback = <LoadingFallback />,
) => {
  const LazyComponent = React.lazy(importFn);

  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = {hasError: false};
    }

    static getDerivedStateFromError(error) {
      return {hasError: true};
    }

    componentDidCatch(error, errorInfo) {
      console.error('Error loading screen:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text>Error loading this screen. Please try again.</Text>
          </View>
        );
      }

      return (
        <Suspense fallback={fallback}>
          <LazyComponent {...this.props} />
        </Suspense>
      );
    }
  }

  return ErrorBoundary;
};

/**
 * Batch preload multiple screens
 * Usage: preloadScreens([
 *   () => import('../screens/Screen1'),
 *   () => import('../screens/Screen2'),
 * ])
 */
export const preloadScreens = async importFns => {
  try {
    await Promise.all(importFns.map(fn => fn()));
    console.log(`✅ ${importFns.length} screens preloaded`);
  } catch (error) {
    console.error('❌ Error preloading screens:', error);
  }
};

/**
 * Strategically preload screens after a delay
 * Useful for preloading screens the user is likely to navigate to next
 * Usage: strategicPreload(2000, () => import('../screens/Dashboard'))
 */
export const strategicPreload = (delayMs, importFn) => {
  setTimeout(() => {
    preloadScreen(importFn);
  }, delayMs);
};

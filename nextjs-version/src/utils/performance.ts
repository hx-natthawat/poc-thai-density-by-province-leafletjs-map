/**
 * Performance optimization utilities for the Thai Population Density Map
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Memoizes a function to cache its results based on the arguments provided.
 * This is useful for expensive calculations that are called with the same arguments.
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Lazy loads a resource and caches the result.
 * @param loader Function that returns a promise resolving to the resource
 */
export function lazyLoad<T>(loader: () => Promise<T>): () => Promise<T> {
  let result: T | null = null;
  let loading = false;
  let waitingResolvers: ((value: T) => void)[] = [];
  
  return async function(): Promise<T> {
    // Return cached result if available
    if (result !== null) {
      return result;
    }
    
    // If already loading, wait for it to complete
    if (loading) {
      return new Promise<T>(resolve => {
        waitingResolvers.push(resolve);
      });
    }
    
    // Start loading
    loading = true;
    try {
      result = await loader();
      // Resolve all waiting promises
      waitingResolvers.forEach(resolve => resolve(result as T));
      waitingResolvers = [];
      return result;
    } finally {
      loading = false;
    }
  };
}

/**
 * Measures the execution time of a function.
 * @param name Name to identify the measurement
 * @param fn Function to measure
 */
export async function measurePerformance<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  console.time(name);
  try {
    const result = await fn();
    return result;
  } finally {
    console.timeEnd(name);
  }
}

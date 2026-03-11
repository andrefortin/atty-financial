// ============================================
// Performance Utilities
// ============================================

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// ============================================
// Debounce Hook
// ============================================

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback as T;
}

// ============================================
// Throttle Hook
// ============================================

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );

  return throttledCallback as T;
}

// ============================================
// Previous Value Hook
// ============================================

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

// ============================================
// Async State Hook
// ============================================

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
): AsyncState<T> {
  const [state, setState] = React.useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setState({ data: null, loading: true, error: null });
        const result = await asyncFunction();
        if (isMounted) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({ data: null, loading: false, error: error as Error });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return state;
}

// ============================================
// Local Storage Hook with Performance
// ============================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ============================================
// Memoized List Rendering Hook
// ============================================

export function useMemoizedList<T, R>(
  items: T[],
  keyFn: (item: T) => string,
  renderFn: (item: T, index: number) => R
): R[] {
  return useMemo(() => {
    return items.map(renderFn);
  }, [items, keyFn, renderFn]);
}

// ============================================
// Batch Updates Hook
// ============================================

export function useBatchUpdates<T>(
  items: T[],
  updateDelay: number = 300
): [T[], (item: T) => void, () => void] {
  const [batchItems, setBatchItems] = useState<T[]>(items);
  const pendingUpdatesRef = useRef<Set<T>>(new Set());

  const flushUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.size > 0) {
      const updates = Array.from(pendingUpdatesRef.current);
      setBatchItems(prev => {
        const newItems = [...prev];
        updates.forEach(update => {
          const index = newItems.findIndex(
            item => (item as any).id === (update as any).id
          );
          if (index !== -1) {
            newItems[index] = update;
          }
        });
        return newItems;
      });
      pendingUpdatesRef.current.clear();
    }
  }, []);

  const debouncedFlush = useDebounce(flushUpdates, updateDelay);

  const updateItem = useCallback(
    (item: T) => {
      pendingUpdatesRef.current.add(item);
      debouncedFlush();
    },
    [debouncedFlush]
  );

  return [batchItems, updateItem, flushUpdates];
}

// ============================================
// Performance Monitoring
// ============================================

export function usePerformanceMonitor(
  name: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const startTimeRef = useRef<number>();

  const start = useCallback(() => {
    if (enabled) {
      startTimeRef.current = performance.now();
    }
  }, [enabled]);

  const end = useCallback(() => {
    if (enabled && startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      startTimeRef.current = undefined;
    }
  }, [enabled, name]);

  const measure = useCallback(
    <T>(fn: () => T): T => {
      start();
      try {
        return fn();
      } finally {
        end();
      }
    },
    [start, end]
  );

  return { start, end, measure };
}

// ============================================
// Intersection Observer Hook for Lazy Loading
// ============================================

export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options || { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [targetRef, options]);

  return isIntersecting;
}

// ============================================
// Window Size Hook with Debounce
// ============================================

export function useWindowSize(debounceMs: number = 200) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const debouncedHandleResize = useDebounce(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, debounceMs);

  useEffect(() => {
    window.addEventListener('resize', debouncedHandleResize);
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, [debouncedHandleResize]);

  return windowSize;
}

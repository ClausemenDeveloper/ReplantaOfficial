import { useCallback, useMemo, useRef, useEffect, useState } from "react";

// Debounce hook for search inputs and API calls
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay],
  );
}

// Throttle hook for scroll events and frequent updates
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay],
  );
}

// Memoized event handlers factory
export function useEventHandlers<
  T extends Record<string, (...args: any[]) => any>,
>(handlers: T, deps: React.DependencyList = []): T {
  return useMemo(() => {
    const memoizedHandlers = {} as T;

    Object.keys(handlers).forEach((key) => {
      memoizedHandlers[key as keyof T] = useCallback(
        handlers[key as keyof T],
        deps,
      ) as T[keyof T];
    });

    return memoizedHandlers;
  }, deps);
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`,
      );
    }

    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
  };
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {},
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        callback(entry);
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);
}

// Virtual list hook for large datasets
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length - 1,
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange,
  };
}

// Cache hook for expensive computations
export function useCache<T>(
  key: string,
  computeFn: () => T,
  deps: React.DependencyList,
): T {
  const cache = useRef(new Map<string, T>());

  return useMemo(() => {
    const cacheKey = `${key}-${deps.join(",")}`;

    if (cache.current.has(cacheKey)) {
      return cache.current.get(cacheKey)!;
    }

    const result = computeFn();
    cache.current.set(cacheKey, result);

    // Clean old cache entries (keep last 10)
    if (cache.current.size > 10) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }

    return result;
  }, deps);
}

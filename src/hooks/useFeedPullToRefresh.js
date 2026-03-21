import { useEffect, useRef } from 'react';
import { usePullToRefresh } from '@/components/hooks/usePullToRefresh';

/**
 * Hook to integrate Pull-to-Refresh on feed pages
 * Handles both container setup and refresh callback
 */
export function useFeedPullToRefresh(onRefresh, enabled = true) {
  const containerRef = useRef(null);
  const { containerProps, isRefreshing, RefreshIndicator } = usePullToRefresh(onRefresh);

  useEffect(() => {
    if (enabled && containerRef.current) {
      Object.assign(containerRef.current, containerProps);
    }
  }, [containerProps, enabled]);

  return {
    containerRef,
    isRefreshing,
    RefreshIndicator,
  };
}
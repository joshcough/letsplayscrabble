import { useState, useEffect, useCallback, useRef } from "react";
import { ApiResponse } from "../config/api";

interface UseApiQueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: <T>(data: T) => void;
  onError?: (error: string) => void;
}

interface UseApiQueryReturn<T> extends UseApiQueryState<T> {
  refetch: () => Promise<void>;
}

/**
 * Hook for API queries (GET) with automatic fetching
 * Similar to React Query's useQuery
 * 
 * @example
 * const { data: tournaments, loading, error } = useApiQuery(
 *   () => apiService.listTournaments(),
 *   { enabled: !!userId }
 * );
 */
export function useApiQuery<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  options: UseApiQueryOptions = {}
): UseApiQueryReturn<T> {
  const { enabled = true, refetchInterval, onSuccess, onError } = options;
  
  const [state, setState] = useState<UseApiQueryState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await queryFn();
      
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        onSuccess?.(response.data);
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error,
        });
        onError?.(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      onError?.(errorMessage);
    }
  }, [queryFn, enabled, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled]); // Only re-run if enabled changes, not on every fetchData change

  // Set up refetch interval if specified
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}
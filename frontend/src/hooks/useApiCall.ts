import { useState, useCallback } from "react";

import { ApiResponse } from "../config/api";

interface UseApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface UseApiCallReturn<T, Args extends any[]> extends UseApiCallState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

/**
 * Generic hook for making API calls with built-in state management
 * Handles loading, error, and success states automatically
 *
 * @example
 * const { data, loading, error, execute } = useApiCall(
 *   async (id: number) => apiService.getTournament(userId, id)
 * );
 */
export function useApiCall<T, Args extends any[] = []>(
  apiFunction: (...args: Args) => Promise<ApiResponse<T>>,
): UseApiCallReturn<T, Args> {
  const [state, setState] = useState<UseApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    success: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        success: null,
      }));

      try {
        const response = await apiFunction(...args);

        if (response.success) {
          setState({
            data: response.data,
            loading: false,
            error: null,
            success: null,
          });
          return response.data;
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error,
            success: null,
          });
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: null,
        });
        return null;
      }
    },
    [apiFunction],
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: null,
    });
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setSuccess = useCallback((success: string | null) => {
    setState((prev) => ({ ...prev, success }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setError,
    setSuccess,
  };
}

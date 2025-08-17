import { useState, useCallback } from "react";
import { ApiResponse } from "../config/api";

interface UseApiMutationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface UseApiMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string | ((data: T) => string);
}

interface UseApiMutationReturn<T, Args extends any[]> extends UseApiMutationState<T> {
  mutate: (...args: Args) => Promise<T | null>;
  mutateAsync: (...args: Args) => Promise<T>;
  reset: () => void;
}

/**
 * Hook for API mutations (POST, PUT, DELETE) with callbacks
 * Similar to React Query's useMutation
 * 
 * @example
 * const createTournament = useApiMutation(
 *   (data: CreateTournamentParams) => apiService.createTournament(data),
 *   {
 *     onSuccess: () => navigate("/tournaments"),
 *     successMessage: "Tournament created successfully!"
 *   }
 * );
 * 
 * // In component:
 * await createTournament.mutate(formData);
 */
export function useApiMutation<T, Args extends any[] = []>(
  apiFunction: (...args: Args) => Promise<ApiResponse<T>>,
  options: UseApiMutationOptions<T> = {}
): UseApiMutationReturn<T, Args> {
  const [state, setState] = useState<UseApiMutationState<T>>({
    data: null,
    loading: false,
    error: null,
    success: null,
  });

  const mutate = useCallback(async (...args: Args): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null, success: null }));

    try {
      const response = await apiFunction(...args);
      
      if (response.success) {
        const successMsg = typeof options.successMessage === 'function' 
          ? options.successMessage(response.data)
          : options.successMessage || null;

        setState({
          data: response.data,
          loading: false,
          error: null,
          success: successMsg,
        });

        options.onSuccess?.(response.data);
        return response.data;
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error,
          success: null,
        });

        options.onError?.(response.error);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: null,
      });

      options.onError?.(errorMessage);
      return null;
    }
  }, [apiFunction, options]);

  const mutateAsync = useCallback(async (...args: Args): Promise<T> => {
    const result = await mutate(...args);
    if (result === null) {
      throw new Error(state.error || "Mutation failed");
    }
    return result;
  }, [mutate, state.error]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  };
}
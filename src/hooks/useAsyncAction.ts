/**
 * useAsyncAction Hook
 * Standardized async action handling with loading, error, and success states
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

interface UseAsyncActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

interface AsyncActionState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsyncAction<T = unknown, P extends unknown[] = unknown[]>(
  asyncFn: (...args: P) => Promise<T>,
  options: UseAsyncActionOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showToast = true,
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<AsyncActionState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await asyncFn(...args);
        setState({ data, loading: false, error: null });

        if (showToast && successMessage) {
          toast({
            title: 'Success',
            description: successMessage,
          });
        }

        onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });

        if (showToast) {
          toast({
            title: 'Error',
            description: errorMessage || error.message || ERROR_MESSAGES.GENERIC,
            variant: 'destructive',
          });
        }

        onError?.(error);
        return null;
      }
    },
    [asyncFn, onSuccess, onError, successMessage, errorMessage, showToast, toast]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && !state.data,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isError: !state.loading && state.error !== null,
  };
}

export default useAsyncAction;

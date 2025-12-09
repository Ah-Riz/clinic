import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for handling async operations with proper error handling
 * Best practice: Centralized async state management
 */

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

interface UseAsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  resetOnExecute?: boolean;
}

export function useAsyncOperation<T = void, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args) => {
      // Reset state if needed
      if (options.resetOnExecute) {
        setState({
          data: null,
          loading: true,
          error: null,
          success: false,
        });
      } else {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      try {
        const result = await asyncFunction(...args);
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
            success: true,
          });
          
          options.onSuccess?.();
        }
        
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (isMountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: err,
            success: false,
          });
          
          options.onError?.(err);
        }
        
        throw err; // Re-throw for caller to handle if needed
      }
    },
    [asyncFunction, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && !state.success,
  };
}

// Example usage:
/*
const { data, loading, error, execute } = useAsyncOperation(
  async (id: string) => {
    const response = await fetch(`/api/patients/${id}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  {
    onSuccess: () => console.log('Success!'),
    onError: (err) => console.error('Error:', err),
  }
);

// In component:
<button onClick={() => execute('123')} disabled={loading}>
  {loading ? 'Loading...' : 'Fetch Patient'}
</button>
*/

import { useEffect } from 'react';

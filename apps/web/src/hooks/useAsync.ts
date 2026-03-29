import { useState, useCallback, useEffect, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOptions {
  immediate?: boolean;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const { immediate = true } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const asyncFunctionRef = useRef(asyncFunction);
  const mountedRef = useRef(true);

  // Always keep ref updated with latest function
  useEffect(() => {
    asyncFunctionRef.current = asyncFunction;
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunctionRef.current();
      if (mountedRef.current) {
        setState({ data, loading: false, error: null });
      }
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: err });
      }
      throw err;
    }
  }, []); // stable reference - never changes

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute().catch(() => {});
    }
    return () => { mountedRef.current = false; };
  }, []); // only run on mount

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && !state.data,
    isLoading: state.loading,
    isError: !!state.error,
    isSuccess: !!state.data && !state.error,
  };
}

export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const asyncFunctionRef = useRef(asyncFunction);
  const mountedRef = useRef(true);

  // Always keep ref updated with latest function
  useEffect(() => {
    asyncFunctionRef.current = asyncFunction;
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await asyncFunctionRef.current(...args);
        if (mountedRef.current) {
          setState({ data, loading: false, error: null });
        }
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (mountedRef.current) {
          setState({ data: null, loading: false, error: err });
        }
        throw err;
      }
    },
    [] // stable reference - never changes
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && !state.data,
    isLoading: state.loading,
    isError: !!state.error,
    isSuccess: !!state.data && !state.error,
  };
}

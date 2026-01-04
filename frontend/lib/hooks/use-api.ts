"use client";

import { useState, useEffect, useCallback } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err: any) {
      setState({
        data: null,
        loading: false,
        error: err.message || "An error occurred",
      });
    }
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  const mutate = useCallback((data: T) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    refetch: fetchData,
    mutate,
  };
}

// Mutation hook for POST/PUT/DELETE
interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: string | null;
  data: TData | null;
  reset: () => void;
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
): UseMutationReturn<TData, TVariables> {
  const [state, setState] = useState<{
    data: TData | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await mutationFn(variables);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err: any) {
        const error = err.message || "An error occurred";
        setState({ data: null, loading: false, error });
        throw err;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

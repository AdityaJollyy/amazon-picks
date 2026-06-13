import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/ApiError";

type AsyncState<T> = {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
};

type UseAsyncOptions<T> = {
  /** If true, run on mount (and whenever deps change). Defaults to true. */
  immediate?: boolean;
  /** Re-run the effect when any of these values change. */
  deps?: ReadonlyArray<unknown>;
  /** Callback invoked with the resolved data. */
  onSuccess?: (data: T) => void;
  /** Callback invoked with the thrown error. */
  onError?: (error: ApiError) => void;
};

/**
 * Lightweight async hook so components don't repeat try/catch + loading state.
 * Returns the latest call's result; in-flight calls that get superseded are
 * ignored (last-write-wins). Errors are normalised to ApiError.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { immediate = true, deps = [], onSuccess, onError } = options;
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: immediate,
  });

  const fnRef = useRef(fn);
  fnRef.current = fn;

  // Track the latest call so stale resolutions don't overwrite fresh state.
  const callId = useRef(0);
  const mounted = useRef(true);

  const run = useCallback(async () => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (!mounted.current || id !== callId.current) return data;
      setState({ data, error: null, loading: false });
      onSuccess?.(data);
      return data;
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError(
              0,
              err instanceof Error ? err.message : "Unknown error"
            );
      if (!mounted.current || id !== callId.current) throw apiError;
      setState({ data: null, error: apiError, loading: false });
      onError?.(apiError);
      throw apiError;
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!immediate) return;
    void run().catch(() => {
      // already captured in state
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reset = useCallback(() => {
    callId.current++;
    setState({ data: null, error: null, loading: false });
  }, []);

  return { ...state, run, reset } as const;
}

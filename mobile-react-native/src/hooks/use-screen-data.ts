import { useFocusEffect } from "expo-router";
import {
  useCallback,
  useRef,
  useState,
} from "react";

export function useScreenData<T>(loader: () => Promise<T>) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const hasDataRef = useRef(false);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else if (!hasDataRef.current) setLoading(true);
    try {
      const nextData = await loaderRef.current();
      hasDataRef.current = true;
      setData(nextData);
      setError(null);
      return nextData;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh().catch(() => undefined);
    }, [refresh]),
  );

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => refresh(true),
  };
}

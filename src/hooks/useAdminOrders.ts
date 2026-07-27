import { useState, useEffect, useCallback, useRef } from "react";
import { getAdminOrders, AdminOrder, OrdersQueryParams } from "@/api/dashboardApi";

const normalizeOrdersQueryParams = (params: OrdersQueryParams): OrdersQueryParams => {
  const normalized: OrdersQueryParams = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      normalized[key as keyof OrdersQueryParams] = value as never;
    }
  });

  return normalized;
};

const areOrdersQueryParamsEqual = (
  current: OrdersQueryParams,
  next: OrdersQueryParams
): boolean => {
  const normalizedCurrent = normalizeOrdersQueryParams(current);
  const normalizedNext = normalizeOrdersQueryParams(next);
  const currentKeys = Object.keys(normalizedCurrent);
  const nextKeys = Object.keys(normalizedNext);

  if (currentKeys.length !== nextKeys.length) return false;

  return currentKeys.every((key) => {
    const paramKey = key as keyof OrdersQueryParams;
    return normalizedCurrent[paramKey] === normalizedNext[paramKey];
  });
};

export const useAdminOrders = (initialParams: OrdersQueryParams = {}) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total_count: 0,
    total_pages: 0,
  });
  const [queryParams, setQueryParams] = useState<OrdersQueryParams>(initialParams);
  
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadOrders = useCallback(async (params: OrdersQueryParams) => {
    // Abort any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    try {
      const data = await getAdminOrders(params, controller.signal);

      // If this request was superseded by a newer one, discard the result
      if (controller.signal.aborted) return;

      setOrders(data.orders);
      setPagination({
        page: data.page,
        page_size: data.page_size,
        total_count: data.total_count,
        total_pages: data.total_pages,
      });
      setError(null);
    } catch (err: any) {
      // Silently ignore cancellation errors
      if (err.name === 'CanceledError') return;
      if (controller.signal.aborted) return;

      console.error("Failed to load admin orders:", err);
      setError(err as Error);
    } finally {
      // Only update loading state if this request wasn't superseded
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Load orders whenever queryParams change
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
    }
    loadOrders(queryParams);

    // Cleanup: abort in-flight request on unmount or queryParams change
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [queryParams, loadOrders]);

  const setPage = useCallback((page: number) => {
    setQueryParams(prev => {
      if (prev.page === page || (!prev.page && page === 1)) {
        return prev;
      }
      return { ...prev, page };
    });
  }, []);

  const setSearch = useCallback((search: string) => {
    setQueryParams(prev => {
      const next = { ...prev, search: search || undefined, page: 1 };
      return areOrdersQueryParamsEqual(prev, next) ? prev : next;
    });
  }, []);

  const setFilters = useCallback((filters: Partial<OrdersQueryParams>) => {
    setQueryParams(prev => {
      const next = { ...prev, ...filters, page: 1 };
      return areOrdersQueryParamsEqual(prev, next) ? prev : next;
    });
  }, []);

  const refetch = useCallback(() => {
    loadOrders(queryParams);
  }, [loadOrders, queryParams]);

  return {
    orders,
    loading,
    error,
    pagination,
    queryParams,
    setPage,
    setSearch,
    setFilters,
    refetch,
  };
};

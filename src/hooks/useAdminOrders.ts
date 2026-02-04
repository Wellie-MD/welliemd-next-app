import { useState, useEffect, useCallback, useRef } from "react";
import { getAdminOrders, AdminOrder, OrdersQueryParams } from "@/api/dashboardApi";

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
  
  // Use ref to track if initial load is done
  const initialLoadDone = useRef(false);

  const loadOrders = useCallback(async (params: OrdersQueryParams) => {
    try {
      setLoading(true);
      const data = await getAdminOrders(params);
      
      setOrders(data.orders);
      setPagination({
        page: data.page,
        page_size: data.page_size,
        total_count: data.total_count,
        total_pages: data.total_pages,
      });
      setError(null);
    } catch (err) {
      console.error("Failed to load admin orders:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders whenever queryParams change
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
    }
    loadOrders(queryParams);
  }, [queryParams, loadOrders]);

  const setPage = useCallback((page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setQueryParams(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const setFilters = useCallback((filters: Partial<OrdersQueryParams>) => {
    setQueryParams(prev => ({ ...prev, ...filters, page: 1 }));
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

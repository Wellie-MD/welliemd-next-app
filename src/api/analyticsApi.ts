// Analytics API Service for Dashboard
import axiosInstance from './axiosInstance';

export interface Treatment {
  id: string;
  name: string;
}

export interface ProductGroup {
  id: string;
  name: string;
}

export interface AnalyticsData {
  period: string;
  visitors: {
    total: number;
    unique: number;
    totalPageviews: number;
    bounceRate: number;
    visitDuration: string;
  };
  chartData: Array<{
    time: string;
    totalVisitors: number;
    uniqueVisitors: number;
    totalPageviews: number;
  }>;
  salesByTreatment: Array<{
    name: string;
    percentage: number;
    total: number;
    count: number;
  }>;
  salesByProductGroup: Array<{
    name: string;
    percentage: number;
    total: number;
    count: number;
  }>;
  customerBehavior: {
    visitors: number;
    checking: number;
    purchased: number;
  };
  totalCheckouts: number;
  totalSales: number;
}

export interface QueryParams {
  start_date: string;
  end_date: string;
  period: string;
  treatment_id?: string;
  product_group_id?: string;
}

/**
 * Fetch analytics data for the given date range and filters
 */
export const getAnalytics = async (params: QueryParams): Promise<AnalyticsData> => {
  try {
    const response = await axiosInstance.get('/analytics/reports/', {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch analytics data:', error);
    throw error;
  }
};

/**
 * Fetch available treatments for filtering
 */
export const getTreatments = async (): Promise<Treatment[]> => {
  try {
    const response = await axiosInstance.get('/products/treatments/', {
      params: {
        limit: 100,
      },
    });
    // Normalize response to array of {id, name}
    const normalize = (rows: any[]) => rows.map((t: any) => ({
        id: t.id || t.pk,
        name: t.name || t.treatment_name,
      }));
    const rows = Array.isArray(response.data)
      ? normalize(response.data)
      : (response.data.results && Array.isArray(response.data.results))
        ? normalize(response.data.results)
        : [];

    // Defensive de-duplication for inconsistent backend responses / legacy data.
    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = String(row.id || "").trim().toLowerCase() || String(row.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.error('Failed to fetch treatments:', error);
    return [];
  }
};

/**
 * Fetch available product groups for filtering
 */
export const getProductGroups = async (): Promise<ProductGroup[]> => {
  try {
    const response = await axiosInstance.get('/products/product-groups/', {
      params: {
        limit: 100,
      },
    });
    // Normalize response to array of {id, name}
    const normalize = (rows: any[]) => rows.map((g: any) => ({
        id: g.id || g.pk,
        name: g.name || g.group_name,
      }));
    const rows = Array.isArray(response.data)
      ? normalize(response.data)
      : (response.data.results && Array.isArray(response.data.results))
        ? normalize(response.data.results)
        : [];

    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = `${String(row.id || "").trim().toLowerCase()}::${String(row.name || "").trim().toLowerCase()}`;
      if (!row.id || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.error('Failed to fetch product groups:', error);
    return [];
  }
};

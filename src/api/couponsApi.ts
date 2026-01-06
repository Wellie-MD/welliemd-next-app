import adminApi from "./adminApi";

export interface CouponUsage {
    id: string;
    code: string;
    name: string;
    value: string;
    coupon_type: "fixed" | "percent";
    max_threshold: string | null;
    frequency_based: boolean;
    discounted_amount: string;
    used_by_patient: string;
    used_on: string;
    order_ref: string;
}

export interface CouponInsights {
    total_uses: number;
    total_discount_amount: number;
    impact_chart: Array<{
        date: string;
        uses: number;
        savings: number;
    }>;
    top_coupons: Array<{
        code: string;
        name: string;
        uses: number;
        savings: number;
    }>;
}

export const getCouponInsights = async (params?: { start_date?: string; end_date?: string }) => {
    const response = await adminApi.get<CouponInsights>("/coupons/insights/", { params });
    return response.data;
};

export const getCouponUsage = async (params?: {
    start_date?: string;
    end_date?: string;
    search?: string;
    code?: string;
    page?: number;
}) => {
    const response = await adminApi.get<{ results: CouponUsage[]; count: number }>("/coupons/usage/", { params });
    return response.data;
};

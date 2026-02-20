import adminApi from "./adminApi";

export interface Affiliate {
    id: string;
    name: string;
    slug: string;
    commission_type: "flat" | "percent";
    commission_value: string;
    discount_type: "flat" | "percent";
    discount_value: string;
    referral_link: string;
    is_active: boolean;
    created_at: string;
}

export interface AffiliateInsights {
    summary: {
        total_referrals: number;
        total_revenue: number;
        total_commission: number;
        commission_type: string;
        commission_value: number;
    };
    impact_chart: {
        date: string;
        referrals: number;
        commission: number;
    }[];
}

export interface PatientCommission {
    order_id: string;
    display_id: string;
    business_order_id: string;
    patient_id: string;
    patient_name: string;
    status: "pending" | "earned" | "cancelled";
    commission: number;
    created_at: string;
}

export interface PaginatedPatientCommissions {
    count: number;
    next: string | null;
    previous: string | null;
    results: PatientCommission[];
}

export const getAffiliateInsights = async (id: string, params?: { start_date?: string; end_date?: string }) => {
    const response = await adminApi.get<AffiliateInsights>(`/affiliates/${id}/insights/`, { params });
    return response.data;
};

export const getAffiliatePatientCommissions = async (
    id: string, 
    params?: { start_date?: string; end_date?: string; page?: number; page_size?: number }
) => {
    const response = await adminApi.get<PaginatedPatientCommissions>(
        `/affiliates/${id}/patient-commissions/`, 
        { params }
    );
    return response.data;
};

export const getAffiliates = async () => {
    const response = await adminApi.get<Affiliate[]>("/affiliates/");
    return response.data;
};

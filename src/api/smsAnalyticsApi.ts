import api from "./axiosInstance";

export type SmsAnalyticsRange = "today" | "week" | "month" | "year" | "all";
export type SmsAudience = "all" | "patient" | "admin";

export interface SmsAnalyticsStats {
  range: SmsAnalyticsRange;
  audience: SmsAudience;
  total_sms: number;
  sent: number;
  delivered: number;
  pending: number;
  failed: number;
  queued: number;
  undelivered: number;
  delivery_rate: number;
  failure_rate: number;
}

export interface SmsDeliveryRow {
  id: string;
  event_id: string;
  queued_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  updated_at: string | null;
  recipient_name: string;
  recipient_phone: string;
  template_type: string;
  template_label: string;
  message_preview: string;
  message_body?: string;
  status: string;
  provider_status: string;
  provider_message_sid: string;
  provider_error_code?: string;
  reason: string;
  retry_count: number;
  can_retry: boolean;
  audience: SmsAudience;
  context_snapshot?: Record<string, unknown>;
}

export interface SmsAnalyticsResponse {
  stats: SmsAnalyticsStats;
  results: SmsDeliveryRow[];
  count: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SmsAnalyticsParams {
  range?: SmsAnalyticsRange;
  audience?: SmsAudience;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const getSmsAnalytics = async (params: SmsAnalyticsParams): Promise<SmsAnalyticsResponse> => {
  const { data } = await api.get("/sms-analytics/", { params });
  return data;
};

export const getSmsDelivery = async (id: string): Promise<SmsDeliveryRow> => {
  const { data } = await api.get(`/sms-analytics/${id}/`);
  return data;
};

export const retrySmsDelivery = async (id: string): Promise<{ status: string; id: string }> => {
  const { data } = await api.post(`/sms-analytics/${id}/retry/`);
  return data;
};

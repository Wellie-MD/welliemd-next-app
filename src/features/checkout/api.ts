import { apiClient } from '@/shared/api/client';

export interface LabPanelDetails {
  id: string;
  slug: string;
  cat: string;
  name: string;
  collection: 'home' | 'clinic';
  lab: string;
  sample: string;
  fasting: string;
  turnaround: string;
  biomarkers: string[];
  price: number;
  discount?: number;
}

export interface CheckoutPayload {
  panelId: string;
  total: number;
}

export async function getLabPanelBySlug(slug: string): Promise<LabPanelDetails> {
  const response = await apiClient.get<Record<string, any>>(
    `/labs/storefront/${encodeURIComponent(slug)}/`,
  );
  const data = response.data;
  const methods = Array.isArray(data.combined_methods) ? data.combined_methods : [];
  const collectionMethod = String(
    data.collection_method || methods[0]?.collection_method || 'walk_in_test',
  );
  return {
    id: String(data.assignment_id || data.id || ''),
    slug: String(data.storefront_slug || slug),
    cat: String(data.category || 'Lab testing'),
    name: String(data.name || 'Lab panel'),
    collection: collectionMethod === 'at_home_phlebotomy' || collectionMethod === 'testkit' ? 'home' : 'clinic',
    lab: String(data.lab_provider || ''),
    sample: String(data.sample_type || data.specimen || ''),
    fasting: data.fasting_required === true || data.fasting_required === 'yes' ? 'Required' : 'Not required',
    turnaround: String(data.common_turnaround_time || data.worst_case_turnaround_time || 'Varies'),
    biomarkers: Array.isArray(data.biomarkers)
      ? data.biomarkers.map((marker: Record<string, unknown>) => String(marker.name || marker.test_name || ''))
      : [],
    price: Number(data.patient_price?.amount ?? data.patient_price ?? 0),
  };
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; discountAmount: number; message?: string }> {
  const response = await apiClient.post<Record<string, any>>('/coupons/coupons/validate/', { code });
  return {
    valid: Boolean(response.data.valid),
    discountAmount: Number(response.data.discount_amount ?? response.data.discountAmount ?? 0),
    message: response.data.message,
  };
}

export async function submitCheckout(payload: any): Promise<{ success: boolean; orderId: string }> {
  const response = await apiClient.post<Record<string, any>>('/labs/checkout/', payload);
  return {
    success: Boolean(response.data.success),
    orderId: String(response.data.orderId || response.data.order_id || ''),
  };
}

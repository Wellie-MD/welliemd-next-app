import { apiClient } from '@/shared/api/client';

export type IntercomBannerVariant = 'inline' | 'card';

/** Action associated with an Intercom banner (url, reaction, email_collector, product_tour). */
export interface IntercomBannerAction {
  type: 'url' | 'reaction' | 'email_collector' | 'product_tour';
  label?: string;
  target?: string;
  reaction_set?: unknown[];
  tour_id?: string;
  tour_url?: string;
  collector_title?: string;
}

export interface IntercomBanner {
  view_id: string;
  id?: string;
  variant: IntercomBannerVariant;
  title: string;
  body: string;
  /** Card-header branding supplied by the backend (Intercom omits these). */
  sender?: string | null;
  eyebrow?: string | null;
  /** Intercom's real presentation fields. */
  style?: string | null;
  position?: string | null;
  show_dismiss_button?: boolean;
  /** Banner call-to-action: url label/target, email collector, reaction set, or tour. */
  action?: IntercomBannerAction | null;
  created_at?: string | null;
  /** Original Intercom banner object, passed through for debugging/console. */
  raw: unknown;
}

interface BannersResponse {
  banners: IntercomBanner[];
}

/**
 * Fetch the Outbound banners the current contact matches.
 * NOTE: each call records an impression in Intercom — call once per display.
 */
export async function fetchIntercomBanners(): Promise<IntercomBanner[]> {
  const response = await apiClient.get<BannersResponse>(
    '/integrations/intercom/banners/',
  );
  return response.data?.banners ?? [];
}

/** Record that the contact dismissed a banner (idempotent server-side). */
export async function dismissIntercomBanner(viewId: string): Promise<void> {
  await apiClient.post(
    `/integrations/intercom/banners/${encodeURIComponent(viewId)}/dismiss/`,
  );
}

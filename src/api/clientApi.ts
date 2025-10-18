// src/api/clientApi.ts
import axiosInstance from './axiosInstance';

export interface Client {
  id: string;
  name: string;
  admin_panel_domain: string;
  api_endpoint: string;
  database_name: string;
  is_active: boolean;
  created_at: string;
  product_count: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    is_active: boolean;
  } | null; // <-- can be null
  card_holder_name: string;
  card_last_four: string;
  payment_gateway: string;
  stripe_subscription_id: string | null;
}

export const clientApi = {
  list: async (): Promise<Client[]> => {
    const { data } = await axiosInstance.get('/clients/');
    const results = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
      ? data
      : [];

    // ensure `user` is either an object or null
    return results.map((c: any) => ({
      ...c,
      user: c?.user ?? null,
    })) as Client[];
  },
};

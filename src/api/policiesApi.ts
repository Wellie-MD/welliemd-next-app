/**
 * Policy & Consent Management API
 * Backend: GET /policy-templates/, GET|POST /client-policies/, create-from-template, publish
 */

import api from './axiosInstance';

export const POLICY_TYPE_SLUGS = [
  'refund_policy',
  'privacy_policy',
  'terms_of_service',
  'consent_telehealth',
  'physician_code_of_conduct',
  'shipping_policy',
] as const;

export type PolicyTypeSlug = (typeof POLICY_TYPE_SLUGS)[number];

export interface PolicyTemplate {
  id: string;
  name: string;
  policy_type: PolicyTypeSlug;
  placeholders: string[];
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientPolicy {
  id: string;
  policy_type: PolicyTypeSlug;
  policy_type_display: string;
  final_content: string;
  status: 'draft' | 'published';
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFromTemplatePayload {
  template_id?: string;
  policy_type?: PolicyTypeSlug;
}

const TEMPLATES_URL = '/policy-templates/';
const CLIENT_POLICIES_URL = '/client-policies/';

/** DRF paginated list: { count, next, previous, results: T[] } */
function unwrapList<T>(data: T[] | { results?: T[] }): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { results?: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

/**
 * Fetch platform policy templates (read-only list).
 */
export const fetchPolicyTemplates = async (): Promise<PolicyTemplate[]> => {
  const { data } = await api.get<PolicyTemplate[] | { results: PolicyTemplate[] }>(TEMPLATES_URL);
  return unwrapList(data);
};

/**
 * Fetch current client's policies (optionally filter by policy_type).
 */
export const fetchClientPolicies = async (
  policyType?: PolicyTypeSlug
): Promise<ClientPolicy[]> => {
  const params = policyType ? { policy_type: policyType } : undefined;
  const { data } = await api.get<ClientPolicy[] | { results: ClientPolicy[] }>(CLIENT_POLICIES_URL, { params });
  return unwrapList(data);
};

/**
 * Create or overwrite a client policy from a template.
 * If a policy for that type already exists, pass force=true (after user confirms in modal).
 */
export const createFromTemplate = async (
  payload: CreateFromTemplatePayload,
  force = false
): Promise<ClientPolicy> => {
  const params = force ? { force: 'true' } : undefined;
  const { data } = await api.post<ClientPolicy>(
    `${CLIENT_POLICIES_URL}create-from-template/`,
    payload,
    { params }
  );
  return data;
};

/**
 * Update a client policy (draft only). Partial update supported.
 */
export const updateClientPolicy = async (
  id: string,
  payload: { final_content?: string; status?: 'draft' | 'published' }
): Promise<ClientPolicy> => {
  const { data } = await api.patch<ClientPolicy>(`${CLIENT_POLICIES_URL}${id}/`, payload);
  return data;
};

/**
 * Publish a client policy (sets status=published, accepted_at=now).
 */
export const publishClientPolicy = async (id: string): Promise<ClientPolicy> => {
  const { data } = await api.post<ClientPolicy>(`${CLIENT_POLICIES_URL}${id}/publish/`);
  return data;
};

export const policiesApi = {
  fetchPolicyTemplates,
  fetchClientPolicies,
  createFromTemplate,
  updateClientPolicy,
  publishClientPolicy,
};

export default policiesApi;

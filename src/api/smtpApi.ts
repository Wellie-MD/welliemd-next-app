import api from './axiosInstance';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1/";
const apiBaseUrl = rawApiBaseUrl.endsWith("/") ? rawApiBaseUrl : `${rawApiBaseUrl}/`;

// --- Mailgun Domain API ---
export interface MailgunDomain {
  name: string;
  smtp_password?: string;
  [key: string]: unknown;
}

export interface MailgunDomainResponse {
  domain: Record<string, unknown>;
  receiving_dns_records: Array<Record<string, unknown>>;
  sending_dns_records: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export type MailgunStatsRange = "today" | "week" | "month" | "year" | "all";

export interface MailgunStatsReason {
  reason: string;
  count: number;
}

export interface MailgunDomainStats {
  domain: string;
  range: MailgunStatsRange;
  start_at: string | null;
  end_at: string | null;
  total_emails: number;
  sent_successfully: number;
  failed: number;
  permanent_failed: number;
  temporary_failed: number;
  bounced: number;
  delivered_after_retry: number;
  skipped: number;
  other: number;
  skipped_reasons: MailgunStatsReason[];
  other_reasons: MailgunStatsReason[];
  opened: number;
  clicked: number;
  unsubscribed: number;
  success_rate: number;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
  last_used: string | null;
  source: "mailgun_metrics" | "mailgun_events" | "local";
}

export type EmailAudience = "all" | "patient" | "admin";

export interface EmailLogRow {
  id: string;
  sent_at: string | null;
  event_at: string | null;
  recipient_name: string;
  recipient_email: string;
  template_type: string;
  template_label: string;
  subject: string;
  status: string;
  provider_event: string;
  reason: string;
  audience: EmailAudience;
  mailgun_message_id: string;
  retry_count: number;
  can_retry: boolean;
}

export interface EmailAnalyticsResponse {
  stats: MailgunDomainStats;
  results: EmailLogRow[];
  count: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface EmailLogDetail extends EmailLogRow {
  preview_html: string;
}

export const createMailgunDomain = async (domain: MailgunDomain): Promise<MailgunDomainResponse> => {
  const { data } = await api.post(`${apiBaseUrl}mailgun-domains/`, domain);
  return data;
};

export const getMailgunDomain = async (domainName: string): Promise<MailgunDomainResponse> => {
  const { data } = await api.get(`${apiBaseUrl}mailgun-domains/${domainName}/`);
  return data;
};

export const verifyMailgunDomain = async (domainName: string): Promise<MailgunDomainResponse> => {
  const { data } = await api.put(`${apiBaseUrl}mailgun-domains/${domainName}/verify/`);
  return data;
};

export const deleteMailgunDomain = async (domainName: string): Promise<unknown> => {
  const { data } = await api.delete(`${apiBaseUrl}mailgun-domains/${domainName}/`);
  return data;
};

export const createMailgunCredentials = async (domainName: string, login: string): Promise<MailgunDomainResponse> => {
  const { data } = await api.post(`${apiBaseUrl}mailgun-domains/${domainName}/credentials/`, { login });
  return data;
};

export const deleteMailgunCredentials = async (domainName: string, login: string): Promise<MailgunDomainResponse> => {
  const { data } = await api.delete(`${apiBaseUrl}mailgun-domains/${domainName}/credentials/${login}/`);
  return data;
};

export const getMailgunDomainStats = async (
  domainName: string,
  range: MailgunStatsRange
): Promise<MailgunDomainStats> => {
  const { data } = await api.get(`${apiBaseUrl}mailgun-domains/${domainName}/stats/`, {
    params: { range },
  });
  return data;
};

export const getMailgunEmailAnalytics = async (
  domainName: string,
  params: {
    range?: MailgunStatsRange;
    audience?: EmailAudience;
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }
): Promise<EmailAnalyticsResponse> => {
  const { data } = await api.get(`${apiBaseUrl}mailgun-domains/${domainName}/email-analytics/`, {
    params,
  });
  return data;
};

export const getMailgunEmailLogDetail = async (
  domainName: string,
  logId: string
): Promise<EmailLogDetail> => {
  const { data } = await api.get(`${apiBaseUrl}mailgun-domains/${domainName}/email-logs/${logId}/`);
  return data;
};

export const retryMailgunEmailLog = async (
  domainName: string,
  logId: string
): Promise<{ status: string; event_id: string }> => {
  const { data } = await api.post(`${apiBaseUrl}mailgun-domains/${domainName}/email-logs/${logId}/retry/`);
  return data;
};

// --- Existing App SMTP API ---
export interface ClientEmailConfiguration {
  id?: number;
  client?: number;
  email_host_user: string;
  email_host_password: string;
  default_from_email: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientEmailConfigurationResponse extends ClientEmailConfiguration {
  id: number;
  client: number;
  created_at: string;
  updated_at: string;
}

const ENDPOINT = '/client-email-configurations/';

/**
 * Fetch all email configurations
 * - Staff/Superuser: returns all
 * - Normal users: returns only their own config
 */
export const fetchEmailConfigurations = async (): Promise<ClientEmailConfigurationResponse[]> => {
  try {
    const { data } = await api.get<ClientEmailConfigurationResponse[]>(ENDPOINT);
    return data;
  } catch (error) {
    console.error('Failed to fetch email configurations:', error);
    throw error;
  }
};

/**
 * Fetch a single email configuration by ID
 */
export const fetchEmailConfiguration = async (id: number): Promise<ClientEmailConfigurationResponse> => {
  try {
    const { data } = await api.get<ClientEmailConfigurationResponse>(`${ENDPOINT}${id}/`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch email configuration ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new email configuration
 * - Staff can create for any client
 * - Normal users create for themselves automatically
 */
export const createEmailConfiguration = async (
  config: ClientEmailConfiguration
): Promise<ClientEmailConfigurationResponse> => {
  try {
    const { data } = await api.post<ClientEmailConfigurationResponse>(ENDPOINT, config);
    return data;
  } catch (error) {
    console.error('Failed to create email configuration:', error);
    throw error;
  }
};

/**
 * Update an existing email configuration
 * - Staff can update any config
 * - Normal users can only update their own config
 */
export const updateEmailConfiguration = async (
  id: number,
  config: Partial<ClientEmailConfiguration>
): Promise<ClientEmailConfigurationResponse> => {
  try {
    const { data } = await api.patch<ClientEmailConfigurationResponse>(
      `${ENDPOINT}${id}/`,
      config
    );
    return data;
  } catch (error) {
    console.error(`Failed to update email configuration ${id}:`, error);
    throw error;
  }
};

/**
 * Replace an entire email configuration
 * - Staff can replace any config
 * - Normal users can only replace their own config
 */
export const replaceEmailConfiguration = async (
  id: number,
  config: ClientEmailConfiguration
): Promise<ClientEmailConfigurationResponse> => {
  try {
    const { data } = await api.put<ClientEmailConfigurationResponse>(
      `${ENDPOINT}${id}/`,
      config
    );
    return data;
  } catch (error) {
    console.error(`Failed to replace email configuration ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an email configuration
 * - Staff can delete any config
 * - Normal users can only delete their own config
 */
export const deleteEmailConfiguration = async (id: number): Promise<void> => {
  try {
    await api.delete(`${ENDPOINT}${id}/`);
  } catch (error) {
    console.error(`Failed to delete email configuration ${id}:`, error);
    throw error;
  }
};

/**
 * Search email configurations
 * Searches by email_host_user and default_from_email
 */
export const searchEmailConfigurations = async (query: string): Promise<ClientEmailConfigurationResponse[]> => {
  try {
    const { data } = await api.get<ClientEmailConfigurationResponse[]>(ENDPOINT, {
      params: { search: query },
    });
    return data;
  } catch (error) {
    console.error('Failed to search email configurations:', error);
    throw error;
  }
};

export const smtpApi = {
  fetchEmailConfigurations,
  fetchEmailConfiguration,
  createEmailConfiguration,
  updateEmailConfiguration,
  replaceEmailConfiguration,
  deleteEmailConfiguration,
  searchEmailConfigurations,
  createMailgunDomain,
  getMailgunDomain,
  verifyMailgunDomain,
  deleteMailgunDomain,
  createMailgunCredentials,
  deleteMailgunCredentials,
  getMailgunDomainStats,
  getMailgunEmailAnalytics,
  getMailgunEmailLogDetail,
  retryMailgunEmailLog
};

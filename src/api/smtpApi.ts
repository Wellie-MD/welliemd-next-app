import api from './axiosInstance';

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
};

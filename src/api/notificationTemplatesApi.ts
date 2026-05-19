import api from './axiosInstance';

// Types
export interface NotificationTemplate {
    id: string;
    name: string;
    template_type: string;
    template_type_display: string;
    subject: string;
    short_description: string;
    email_body: string;
    sms_body: string;
    email_enabled: boolean;
    sms_enabled: boolean;
    available_variables: TemplateVariable[];
    created_at: string;
    updated_at: string;
}

export interface NotificationTemplateListItem {
    id: string;
    name: string;
    template_type: string;
    template_type_display: string;
    subject: string;
    email_enabled: boolean;
    sms_enabled: boolean;
    created_at: string;
}

export interface TemplateVariable {
    key: string;
    description: string;
}

export interface TemplateTypeInfo {
    value: string;
    label: string;
    variables: TemplateVariable[];
}

export interface CreateNotificationTemplatePayload {
    name: string;
    template_type: string;
    subject?: string;
    short_description?: string;
    email_body?: string;
    sms_body?: string;
    email_enabled?: boolean;
    sms_enabled?: boolean;
}

export interface UpdateNotificationTemplatePayload {
    name?: string;
    template_type?: string;
    subject?: string;
    short_description?: string;
    email_body?: string;
    sms_body?: string;
    email_enabled?: boolean;
    sms_enabled?: boolean;
}

const ENDPOINT = '/notification-templates/';

/**
 * Fetch all notification templates for the current client
 */
export const fetchNotificationTemplates = async (): Promise<NotificationTemplateListItem[]> => {
    const { data } = await api.get<NotificationTemplateListItem[]>(ENDPOINT);
    return data;
};

/**
 * Fetch a single notification template by ID
 */
export const fetchNotificationTemplate = async (id: string): Promise<NotificationTemplate> => {
    const { data } = await api.get<NotificationTemplate>(`${ENDPOINT}${id}/`);
    return data;
};

/**
 * Create a new notification template
 */
export const createNotificationTemplate = async (
    payload: CreateNotificationTemplatePayload
): Promise<NotificationTemplate> => {
    const { data } = await api.post<NotificationTemplate>(ENDPOINT, payload);
    return data;
};

/**
 * Update an existing notification template
 */
export const updateNotificationTemplate = async (
    id: string,
    payload: UpdateNotificationTemplatePayload
): Promise<NotificationTemplate> => {
    const { data } = await api.patch<NotificationTemplate>(`${ENDPOINT}${id}/`, payload);
    return data;
};

/**
 * Delete a notification template
 */
export const deleteNotificationTemplate = async (id: string): Promise<void> => {
    await api.delete(`${ENDPOINT}${id}/`);
};

/**
 * Fetch available template types with their variables
 */
export const fetchTemplateTypes = async (): Promise<TemplateTypeInfo[]> => {
    const { data } = await api.get<TemplateTypeInfo[]>(`${ENDPOINT}template-types/`);
    return data;
};

/**
 * Test all templates by sending to a test email
 */
export interface TestAllTemplatesResponse {
    success: boolean;
    summary: string;
    total: number;
    successful: number;
    failed: number;
    recipient: string;
    results: Record<string, { status: string; success: boolean; error?: string }>;
}

export const testTemplates = async (
    recipientEmail: string,
    templateTypes?: string[]
): Promise<TestAllTemplatesResponse> => {
    const { data } = await api.post<TestAllTemplatesResponse>(
        `${ENDPOINT}test-all-templates/`,
        {
            recipient_email: recipientEmail,
            template_types: templateTypes
        }
    );
    return data;
};

// Keep for backwards compatibility
export const testAllTemplates = testTemplates;

// Export default object for convenience
export const notificationTemplatesApi = {
    fetchAll: fetchNotificationTemplates,
    fetch: fetchNotificationTemplate,
    create: createNotificationTemplate,
    update: updateNotificationTemplate,
    delete: deleteNotificationTemplate,
    fetchTemplateTypes: fetchTemplateTypes,
    testTemplates: testTemplates,
    testAllTemplates: testAllTemplates,
};

export default notificationTemplatesApi;

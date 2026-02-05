import axiosInstance from "./axiosInstance";

export interface WebhookEndpoint {
    id: string;
    name: string;
    url: string;
    method: "POST" | "PUT";
    status: "active" | "inactive" | "archived";
    events: string[];
    headers: Record<string, string>;
    secret: string;
    created_at: string;
    updated_at: string;
}

export type CreateWebhookPayload = Omit<WebhookEndpoint, "id" | "created_at" | "updated_at" | "secret">;
export type UpdateWebhookPayload = Partial<CreateWebhookPayload>;

export const webhooksApi = {
    getEndpoints: async () => {
        const response = await axiosInstance.get<WebhookEndpoint[]>("/webhooks/endpoints/");
        return response.data;
    },

    createEndpoint: async (payload: CreateWebhookPayload) => {
        const response = await axiosInstance.post<WebhookEndpoint>("/webhooks/endpoints/", payload);
        return response.data;
    },

    updateEndpoint: async (id: string, payload: UpdateWebhookPayload) => {
        const response = await axiosInstance.put<WebhookEndpoint>(`/webhooks/endpoints/${id}/`, payload);
        return response.data;
    },

    deleteEndpoint: async (id: string) => {
        await axiosInstance.delete(`/webhooks/endpoints/${id}/`);
    },
};

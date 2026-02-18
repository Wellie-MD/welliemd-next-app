import { apiClient } from "@/shared/api/client";

export interface BlogResource {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string[];
  published_at: string | null;
  views_count: number;
  likes_count: number;
  read_time_minutes: number;
  author_name: string;
}

export const resourcesApi = {
  /**
   * Fetch all published resources for the current patient's client.
   */
  getAll: async (params?: {
    search?: string;
    category?: string;
  }): Promise<BlogResource[]> => {
    const response = await apiClient.get<BlogResource[]>(
      "/patient/resources/",
      { params }
    );
    return response.data;
  },

  /**
   * Fetch a single published resource by id.
   * Also increments the view counter server-side.
   */
  getById: async (id: string): Promise<BlogResource> => {
    const response = await apiClient.get<BlogResource>(
      `/patient/resources/${id}/`
    );
    return response.data;
  },
};

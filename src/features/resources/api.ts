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
  is_liked: boolean;
  is_bookmarked: boolean;
}

export interface ResourceCategory {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
}

export const resourcesApi = {
  /**
   * Fetch all published resources for the current patient's client.
   */
  getAll: async (params?: {
    search?: string;
    category?: string;
    is_bookmarked?: boolean;
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
  /**
   * Toggle like status for a resource.
   */
  toggleLike: async (id: string): Promise<{ status: string, likes_count: number }> => {
    const response = await apiClient.post<{ status: string, likes_count: number }>(
      `/patient/resources/${id}/toggle-like/`,
      {}
    );
    return response.data;
  },

  /**
   * Toggle bookmark status for a resource.
   */
  toggleBookmark: async (id: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(
      `/patient/resources/${id}/toggle-bookmark/`,
      {}
    );
    return response.data;
  },

  /**
   * Fetch resource categories for the current patient's client.
   */
  getCategories: async (): Promise<ResourceCategory[]> => {
    const response = await apiClient.get<ResourceCategory[]>(
      "/patient-resource-categories/"
    );
    return response.data;
  },
};

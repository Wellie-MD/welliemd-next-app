import axiosInstance from "./axiosInstance";

export interface PatientResource {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  category_id: string | null;
  tags: string[];
  status: "draft" | "published" | "archived";
  published_at: string | null;
  views_count: number;
  likes_count: number;
  read_time_minutes: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface PatientResourcePayload {
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  author_name: string;
  category_id?: string | null;
  tags?: string[];
  status?: "draft" | "published" | "archived";
  read_time_minutes?: number;
}

export interface ResourceCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export const patientResourcesApi = {
  // List all resources for the current client
  getAll: async (params?: {
    status?: string;
    category?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await axiosInstance.get<PatientResource[]>(
      "/patient-resources/",
      { params }
    );
    return response.data;
  },

  // Get a single resource
  getById: async (id: string) => {
    const response = await axiosInstance.get<PatientResource>(
      `/patient-resources/${id}/`
    );
    return response.data;
  },

  // Create a new resource
  create: async (payload: PatientResourcePayload) => {
    const response = await axiosInstance.post<PatientResource>(
      "/patient-resources/",
      payload
    );
    return response.data;
  },

  // Update a resource
  update: async (id: string, payload: Partial<PatientResourcePayload>) => {
    const response = await axiosInstance.patch<PatientResource>(
      `/patient-resources/${id}/`,
      payload
    );
    return response.data;
  },

  // Delete a resource
  delete: async (id: string) => {
    await axiosInstance.delete(`/patient-resources/${id}/`);
  },

  // Publish a resource
  publish: async (id: string) => {
    const response = await axiosInstance.post<PatientResource>(
      `/patient-resources/${id}/publish/`
    );
    return response.data;
  },

  // Archive a resource
  archive: async (id: string) => {
    const response = await axiosInstance.post<PatientResource>(
      `/patient-resources/${id}/archive/`
    );
    return response.data;
  },

  // Upload an inline image
  uploadImage: async (file: File, altText?: string) => {
    const formData = new FormData();
    formData.append("image", file);
    if (altText) formData.append("alt_text", altText);

    const response = await axiosInstance.post<{
      id: string;
      url: string;
      alt_text: string;
    }>("/resource-images/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Resource categories
  getCategories: async () => {
    const response = await axiosInstance.get<ResourceCategory[]>(
      "/patient-resource-categories/"
    );
    return response.data;
  },

  createCategory: async (name: string) => {
    const response = await axiosInstance.post<ResourceCategory>(
      "/patient-resource-categories/",
      { name }
    );
    return response.data;
  },

  deleteCategory: async (id: string) => {
    await axiosInstance.delete(`/patient-resource-categories/${id}/`);
  },
};

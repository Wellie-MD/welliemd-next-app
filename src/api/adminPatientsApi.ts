import axiosInstance from "./axiosInstance";

export type AdminPatientTreatment = {
  name: string;
  status: "active" | "inactive" | string;
};

export type AdminPatientOrder = {
  id: string;
  display_id: string;
  product_name: string;
  amount: number;
  status: string;
  status_display: string;
  payment_status: string;
  created_at: string;
};

export type AdminPatient = {
  id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  patient_portal_domain?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joined: string;
  last_activity: string;
  status: string;
  status_display: string;
  orders_count: number;
  treatments: AdminPatientTreatment[];
  orders: AdminPatientOrder[];
};

export type AdminPatientsResponse = {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  patients: AdminPatient[];
};

export type AdminPatientsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  client_id?: string;
};

export const fetchAdminPatients = async (
  params: AdminPatientsParams = {}
): Promise<AdminPatientsResponse> => {
  const { data } = await axiosInstance.get<AdminPatientsResponse>("/admin/dashboard/patients/", {
    params,
  });
  return data;
};

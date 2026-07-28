import axiosInstance from "./axiosInstance";

export type SuperAdminPortalType = "client" | "patient";

export type SuperAdminAccessStartResponse = {
  grant_id: string;
  request_id: string;
  session_id: string;
  launch_url: string;
  handoff_expires_at: string;
  expires_at: string;
  portal_type: SuperAdminPortalType;
  access_mode: "full" | "read_only";
};

export const startSuperAdminAccess = async (
  clientId: string,
  portalType: SuperAdminPortalType,
  targetContext: Record<string, unknown> = {}
): Promise<SuperAdminAccessStartResponse> => {
  const { data } = await axiosInstance.post<SuperAdminAccessStartResponse>("/superadmin/access/start/", {
    client_id: clientId,
    portal_type: portalType,
    target_context: targetContext,
  });
  return data;
};

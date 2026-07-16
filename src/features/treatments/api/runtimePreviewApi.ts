import axiosInstance from "@/api/axiosInstance";

export const createRuntimePreviewSession = async (
  customProgramId: string,
): Promise<{ session_token: string }> => {
  const { data } = await axiosInstance.post<{ session_token: string }>(
    `treatments/custom-programs/${customProgramId}/runtime-sessions/`,
    { mode: "preview" },
  );
  return data;
};

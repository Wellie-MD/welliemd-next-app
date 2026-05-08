import api from "./axiosInstance";

export type NotificationPreferencesPayload = {
  preferences: Record<string, { email: boolean; sms: boolean; slack?: boolean }>;
};

export async function fetchNotificationPreferences() {
  const { data } = await api.get<NotificationPreferencesPayload>("/notification-preferences/");
  return data.preferences || {};
}

export async function saveNotificationPreferences(
  preferences: Record<string, { email: boolean; sms: boolean; slack?: boolean }>
) {
  const { data } = await api.patch<NotificationPreferencesPayload>("/notification-preferences/", { preferences });
  return data.preferences || {};
}

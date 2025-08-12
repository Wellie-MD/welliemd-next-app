import api from "./axiosInstance";

interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginResponse {
  access: string;
  user: User;
}

// Login with credentials
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login/", {
    email,
    password,
  });
  return data;
};

// Logout (will clear the refresh token cookie)
export const logout = async (): Promise<void> => {
  await api.post("/auth/logout/");
};

// Get current user data
export const getMe = async (): Promise<User> => {
  const { data } = await api.get<User>("/auth/me/");
  return data;
};

// Refresh access token using the HttpOnly cookie
export const refreshToken = async (): Promise<{ access: string }> => {
  const { data } = await api.post<{ access: string }>("/auth/refresh/");
  return data;
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<void> => {
  await api.post("/auth/password-reset/request/", { email });
};

// Confirm password reset
export const confirmPasswordReset = async (
  token: string,
  newPassword: string
): Promise<void> => {
  await api.post("/auth/password-reset/confirm/", {
    token,
    new_password: newPassword,
  });
};

// Register new user
export const registerUser = async (formData: {
  email: string;
  password: string;
  name: string;
}): Promise<User> => {
  const { data } = await api.post<User>("/auth/register/", formData);
  return data;
};

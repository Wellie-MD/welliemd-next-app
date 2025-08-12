import axiosInstance from "./axiosInstance";

// Login
export const login = async (email: string, password: string) => {
  const { data } = await axiosInstance.post("/auth/login/", {
    email,
    password,
  });
  return data;
};

// Logout
export const logout = async () => {
  const { data } = await axiosInstance.post("/auth/logout/create");
  return data;
};

// Get current user
export const getMe = async () => {
  const { data } = await axiosInstance.get("/auth/me");
  return data;
};

// Request password reset link
export const requestPasswordReset = async (email: string) => {
  const { data } = await axiosInstance.post("/auth/password-reset/request/", {
    email,
  });
  return data;
};

// Confirm password reset
export const confirmPasswordReset = async (email: string, newPassword: string) => {
  const { data } = await axiosInstance.post("/auth/password-reset/confirm/", {
    email,
    new_password: newPassword,
  });
  return data;
};

// Register new user
export const registerUser = async (formData: {
  email: string;
  password: string;
  name: string;
}) => {
  const { data } = await axiosInstance.post("/auth/register/", formData);
  return data;
};

// Token refresh
export const refreshToken = async (refresh: string) => {
  const { data } = await axiosInstance.post("/auth/token/refresh_create/", {
    refresh,
  });
  return data;
};

// Token verify
export const verifyToken = async (token: string) => {
  const { data } = await axiosInstance.post("/auth/token/verify_create/", {
    token,
  });
  return data;
};

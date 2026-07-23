// This used to be a separate axios instance with only a request interceptor —
// no response interceptor meant 401s from clients/coupons/affiliates/wearables
// calls never triggered a token refresh or redirect to sign-in, so an expired
// session silently failed instead of logging the user out. Reuse the shared
// instance (same auth/refresh/redirect handling as everything else) instead of
// maintaining a second, incomplete copy of that logic.
import axiosInstance from "./axiosInstance";

export default axiosInstance;

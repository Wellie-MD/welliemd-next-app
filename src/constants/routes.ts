/**
 * Application route constants
 * These define the frontend routes used throughout the application
 */
export const CLIENT_ROUTES = {
    // Dashboard routes
    DASHBOARD: '/dashboard',
    
    // Authentication routes
    LOGIN: '/auth/signin',
    REGISTER: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    
    // Dashboard sub-routes
    PATIENTS: '/dashboard/patients',
    TREATMENTS: '/dashboard/treatments',
    ORDERS: '/dashboard/orders',
    PRODUCTS: '/dashboard/products',
    ANALYTICS: '/dashboard/analytics',
    MESSAGES: '/dashboard/messages',
    SETTINGS: '/dashboard/settings',
  } as const;
  
  /**
   * Backend API endpoint constants
   * These define the actual backend API routes
   */
  export const API_ROUTES = {
    // Authentication endpoints
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    TOKEN_REFRESH: '/auth/token/refresh/',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request/',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm/',

    // User endpoints
    USER_ME: '/users/me/',
  } as const;
  
  export type ClientRoute = typeof CLIENT_ROUTES[keyof typeof CLIENT_ROUTES];
  export type ApiRoute = typeof API_ROUTES[keyof typeof API_ROUTES];
  
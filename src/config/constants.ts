/**
 * Application-wide constants
 * Centralized location for all constant values used throughout the app
 */

// Application metadata
export const APP_CONFIG = {
  NAME: 'WellieMD Patient Portal',
  DESCRIPTION: 'Secure patient portal for managing your healthcare',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@welliemd.com',
  PRIVACY_POLICY_URL: 'https://welliemd.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://welliemd.com/terms',
  HELP_CENTER_URL: 'https://help.welliemd.com',
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  DEFAULT_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  REQUEST_ID_HEADER: 'X-Request-ID',
  CORRELATION_ID_HEADER: 'X-Correlation-ID',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    IMPERSONATE_LOGIN: '/auth/impersonate-login/',
    END_IMPERSONATION: '/auth/end-impersonation/',
    LOGOUT: '/auth/logout/',
    REGISTER: '/auth/register/',
    ME: '/auth/me/',
    TOKEN: '/auth/token/',
    TOKEN_REFRESH: '/auth/token/refresh/',
    REFRESH: '/auth/token/refresh/', // Alias for backward compatibility
    TOKEN_VERIFY: '/auth/token/verify/',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request/',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm/',
    CHANGE_PASSWORD: '/auth/change-password/',
  },
  USERS: {
    ME: '/users/me/',
    UPDATE_PROFILE: '/users/me/',
  },
  MEDICAL: {
    PATIENTS: {
      MY_PROFILE: '/medical/patients/my_profile/',
      CREATE_PROFILE: '/medical/patients/create_profile/',
      UPDATE_PROFILE: '/medical/patients/update_profile/',
    },
  },
  MESSAGES: {
    SEND: "/messages/send/",
    LIST: "/messages/",
  },
  PAYMENTS: {
    CONFIG: "/questionnaires/frontend/payment-config/",
    STRIPE_PAYMENT_METHODS: "/stripe/payment-methods/",
    NMI_PAYMENT_METHODS: "/nmi/payment-methods/",
    AUTHNET_PAYMENT_METHODS: "/authorizenet/payment-methods/",
  },
  TREATMENTS: {
    AVAILABLE: '/treatments/available/',
  },
  RESOURCES: {
    LIST: "/patient/resources/",
    DETAIL: (id: string) => `/patient/resources/${id}/`,
  },
} as const;

// Authentication constants
export const AUTH_CONFIG = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes in milliseconds
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'welliemd_auth_token',
  REFRESH_TOKEN: 'welliemd_refresh_token',
  USER_PREFERENCES: 'welliemd_user_preferences',
  THEME: 'welliemd_theme',
  SIDEBAR_STATE: 'welliemd_sidebar_state',
  FEATURE_FLAGS: 'welliemd_feature_flags',
  LAST_ACTIVITY: 'welliemd_last_activity',
} as const;

// Date and time formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy h:mm a',
  ISO: 'yyyy-MM-dd',
  TIME: 'h:mm a',
  FULL: 'EEEE, MMMM dd, yyyy',
  RELATIVE: 'relative', // for date-fns formatDistanceToNow
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  MAX_FILES: 5,
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  ZIPCODE: /^\d{5}(-\d{4})?$/,
  SSN: /^\d{3}-?\d{2}-?\d{4}$/,
  MEDICAL_RECORD_NUMBER: /^[A-Z0-9]{6,12}$/,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  PATIENT_PROFILE_UPDATED: 'Patient profile updated successfully.',
  APPOINTMENT_BOOKED: 'Appointment booked successfully.',
  APPOINTMENT_CANCELLED: 'Appointment cancelled successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
} as const;

// Loading messages
export const LOADING_MESSAGES = {
  SIGNING_IN: 'Signing in...',
  LOADING_PROFILE: 'Loading profile...',
  LOADING_PATIENT_PROFILE: 'Loading patient information...',
  SAVING_CHANGES: 'Saving changes...',
  UPLOADING_FILE: 'Uploading file...',
  SENDING_MESSAGE: 'Sending message...',
  LOADING_DATA: 'Loading data...',
  PROCESSING: 'Processing...',
  UPDATING_PASSWORD: 'Updating password...',
} as const;

// Medical constants
export const MEDICAL = {
  BLOOD_TYPES: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const,
  GENDERS: ['Male', 'Female', 'Other'] as const,
  US_STATES: [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
  ] as const,
  APPOINTMENT_TYPES: [
    'consultation',
    'follow-up',
    'procedure',
    'emergency',
    'telemedicine',
    'lab-work',
    'imaging',
  ] as const,
  APPOINTMENT_STATUSES: [
    'scheduled',
    'confirmed',
    'in-progress',
    'completed',
    'cancelled',
    'no-show',
    'rescheduled',
  ] as const,
  PRIORITY_LEVELS: ['low', 'normal', 'high', 'urgent'] as const,
} as const;

// UI constants
export const UI = {
  DEBOUNCE_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
  TOAST_DURATION: 5000, // milliseconds
  MODAL_ANIMATION_DURATION: 150, // milliseconds
  SIDEBAR_WIDTH: 256, // pixels
  HEADER_HEIGHT: 64, // pixels
  MOBILE_BREAKPOINT: 768, // pixels
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: 'ENABLE_DARK_MODE',
  ENABLE_TELEMEDICINE: 'ENABLE_TELEMEDICINE',
  ENABLE_PATIENT_MESSAGING: 'ENABLE_PATIENT_MESSAGING',
  ENABLE_APPOINTMENT_REMINDERS: 'ENABLE_APPOINTMENT_REMINDERS',
  ENABLE_PRESCRIPTION_REFILLS: 'ENABLE_PRESCRIPTION_REFILLS',
  ENABLE_LAB_RESULTS_PORTAL: 'ENABLE_LAB_RESULTS_PORTAL',
  ENABLE_PROVIDER_ANALYTICS: 'ENABLE_PROVIDER_ANALYTICS',
  ENABLE_ADMIN_PANEL: 'ENABLE_ADMIN_PANEL',
  ENABLE_MOBILE_APP_PROMOTION: 'ENABLE_MOBILE_APP_PROMOTION',
  ENABLE_NEW_DASHBOARD: 'ENABLE_NEW_DASHBOARD',
} as const;

// Analytics events
export const ANALYTICS_EVENTS = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  
  // Navigation
  PAGE_VIEW: 'page_view',
  SIDEBAR_TOGGLE: 'sidebar_toggle',
  
  // Profile
  PROFILE_UPDATE: 'profile_update',
  PATIENT_PROFILE_UPDATE: 'patient_profile_update',
  PASSWORD_CHANGE: 'password_change',
  
  // Appointments
  APPOINTMENT_BOOK: 'appointment_book',
  APPOINTMENT_CANCEL: 'appointment_cancel',
  APPOINTMENT_RESCHEDULE: 'appointment_reschedule',
  
  // Messages
  MESSAGE_SEND: 'message_send',
  MESSAGE_READ: 'message_read',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
} as const;

// Social links
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/welliemd',
  TWITTER: 'https://twitter.com/welliemd',
  LINKEDIN: 'https://linkedin.com/company/welliemd',
  INSTAGRAM: 'https://instagram.com/welliemd',
} as const;

// Contact information
export const CONTACT_INFO = {
  PHONE: '+1 (555) 123-4567',
  EMAIL: 'contact@welliemd.com',
  ADDRESS: '123 Healthcare Ave, Medical City, MC 12345',
  HOURS: 'Monday - Friday: 8:00 AM - 6:00 PM',
  EMERGENCY: '911 or +1 (555) 911-HELP',
} as const;

// Regular expressions for common validations
export const REGEX = {
  EMAIL: VALIDATION_PATTERNS.EMAIL,
  PHONE: VALIDATION_PATTERNS.PHONE,
  PASSWORD: VALIDATION_PATTERNS.PASSWORD,
  ZIPCODE: VALIDATION_PATTERNS.ZIPCODE,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  LETTERS_ONLY: /^[a-zA-Z\s]+$/,
  NUMBERS_ONLY: /^\d+$/,
  URL: /^https?:\/\/.+/,
} as const;

// Environment-specific constants
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

// HTTP status codes (commonly used ones)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Export all constants as a single object for easier importing
export const CONSTANTS = {
  APP_CONFIG,
  API_CONFIG,
  AUTH_CONFIG,
  STORAGE_KEYS,
  DATE_FORMATS,
  PAGINATION,
  FILE_UPLOAD,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
  MEDICAL,
  UI,
  FEATURE_FLAGS,
  ANALYTICS_EVENTS,
  SOCIAL_LINKS,
  CONTACT_INFO,
  REGEX,
  ENVIRONMENT,
  HTTP_STATUS,
} as const;

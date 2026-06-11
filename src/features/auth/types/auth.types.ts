import { z } from 'zod';

// User role enum
export enum UserRole {
  PATIENT = 'patient',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

// User status enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

// Base user schema (matches API response)
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  auth_user: z.number(),
  is_impersonated: z.boolean().optional(),
  // Extended fields for client-side use
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  avatar: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  lastLoginAt: z.string().datetime().optional(),
});

// Auth tokens schema
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  // refreshToken is now handled via HTTP-only cookie
  expiresIn: z.number().optional(),
  tokenType: z.literal('Bearer').default('Bearer'),
});

// Login request schema
export const LoginRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false),
  portal: z.string().default('patient'),
});

// Login response schema (matches API response)
// Refresh token is handled via HTTP-only cookie
// Access token is stored in memory only
export const LoginResponseSchema = z.object({
  access: z.string(),
  user: UserSchema,
});

// Enhanced login response for client use
export const EnhancedLoginResponseSchema = z.object({
  user: UserSchema,
  tokens: AuthTokensSchema,
  permissions: z.array(z.string()),
  features: z.record(z.boolean()).optional(),
});

// Register request schema
export const RegisterRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    ),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Forgot password request schema
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  portal: z.enum(['patient', 'client']).optional().default('patient'),
});

// Reset password request schema
export const ResetPasswordRequestSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    ),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Change password request schema
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    ),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Update profile request schema
export const UpdateProfileRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  avatar: z.string().url().optional(),
});

// Auth state schema
export const AuthStateSchema = z.object({
  user: UserSchema.nullable(),
  tokens: AuthTokensSchema.nullable(),
  permissions: z.array(z.string()),
  features: z.record(z.boolean()),
  isAuthenticated: z.boolean(),
  isImpersonated: z.boolean(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
});

// Additional API schemas
export const TokenRefreshRequestSchema = z.object({
  refresh: z.string().min(1, 'Refresh token is required'),
});

export const TokenRefreshResponseSchema = z.object({
  access: z.string(),
  // refresh token is handled via HTTP-only cookie
});

export const TokenVerifyRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const LogoutRequestSchema = z.object({
  // No need to send refresh token in request body as it's in HTTP-only cookie
}).passthrough();

export const PaginatedUserResponseSchema = z.object({
  count: z.number(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(UserSchema),
});

export const ApiErrorResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.string()).optional(),
});

export const MessageResponseSchema = z.object({
  message: z.string(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type EnhancedLoginResponse = z.infer<typeof EnhancedLoginResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type AuthState = z.infer<typeof AuthStateSchema>;
export type TokenRefreshRequest = z.infer<typeof TokenRefreshRequestSchema>;
export type TokenRefreshResponse = z.infer<typeof TokenRefreshResponseSchema>;
export type TokenVerifyRequest = z.infer<typeof TokenVerifyRequestSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type PaginatedUserResponse = z.infer<typeof PaginatedUserResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

// Permission constants
export const PERMISSIONS = {
  // Patient permissions
  PATIENT_READ_OWN_DATA: 'patient:read:own_data',
  PATIENT_UPDATE_OWN_PROFILE: 'patient:update:own_profile',
  PATIENT_VIEW_APPOINTMENTS: 'patient:view:appointments',
  PATIENT_BOOK_APPOINTMENTS: 'patient:book:appointments',
  PATIENT_VIEW_MEDICAL_RECORDS: 'patient:view:medical_records',
  PATIENT_VIEW_PRESCRIPTIONS: 'patient:view:prescriptions',
  PATIENT_SEND_MESSAGES: 'patient:send:messages',

  // Payment method permissions
  PAYMENT_METHOD_LIST: 'payment_method:list',
  PAYMENT_METHOD_CREATE: 'payment_method:create',
  PAYMENT_METHOD_UPDATE: 'payment_method:update',
  PAYMENT_METHOD_DELETE: 'payment_method:delete',
  
  // Provider permissions
  PROVIDER_VIEW_PATIENTS: 'provider:view:patients',
  PROVIDER_UPDATE_PATIENT_RECORDS: 'provider:update:patient_records',
  PROVIDER_MANAGE_APPOINTMENTS: 'provider:manage:appointments',
  PROVIDER_PRESCRIBE_MEDICATIONS: 'provider:prescribe:medications',
  PROVIDER_VIEW_ANALYTICS: 'provider:view:analytics',
  
  // Admin permissions
  ADMIN_MANAGE_USERS: 'admin:manage:users',
  ADMIN_MANAGE_PROVIDERS: 'admin:manage:providers',
  ADMIN_VIEW_SYSTEM_LOGS: 'admin:view:system_logs',
  ADMIN_MANAGE_SETTINGS: 'admin:manage:settings',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Base permission sets to avoid circular references during initialization
const PROVIDER_BASE_PERMISSIONS: Permission[] = [
  PERMISSIONS.PROVIDER_VIEW_PATIENTS,
  PERMISSIONS.PROVIDER_UPDATE_PATIENT_RECORDS,
  PERMISSIONS.PROVIDER_MANAGE_APPOINTMENTS,
  PERMISSIONS.PROVIDER_PRESCRIBE_MEDICATIONS,
  PERMISSIONS.PROVIDER_VIEW_ANALYTICS,
];

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.PATIENT]: [
    PERMISSIONS.PATIENT_READ_OWN_DATA,
    PERMISSIONS.PATIENT_UPDATE_OWN_PROFILE,
    PERMISSIONS.PATIENT_VIEW_APPOINTMENTS,
    PERMISSIONS.PATIENT_BOOK_APPOINTMENTS,
    PERMISSIONS.PATIENT_VIEW_MEDICAL_RECORDS,
    PERMISSIONS.PATIENT_VIEW_PRESCRIPTIONS,
    PERMISSIONS.PATIENT_SEND_MESSAGES,
    PERMISSIONS.PAYMENT_METHOD_LIST,
    PERMISSIONS.PAYMENT_METHOD_CREATE,
    PERMISSIONS.PAYMENT_METHOD_UPDATE,
    PERMISSIONS.PAYMENT_METHOD_DELETE,
  ],
  [UserRole.PROVIDER]: [
    ...PROVIDER_BASE_PERMISSIONS,
  ],
  [UserRole.ADMIN]: [
    PERMISSIONS.ADMIN_MANAGE_USERS,
    PERMISSIONS.ADMIN_MANAGE_PROVIDERS,
    PERMISSIONS.ADMIN_VIEW_SYSTEM_LOGS,
    PERMISSIONS.ADMIN_MANAGE_SETTINGS,
    PERMISSIONS.PAYMENT_METHOD_LIST,
    PERMISSIONS.PAYMENT_METHOD_CREATE,
    PERMISSIONS.PAYMENT_METHOD_UPDATE,
    PERMISSIONS.PAYMENT_METHOD_DELETE,
    // Admins also have all provider permissions
    ...PROVIDER_BASE_PERMISSIONS,
  ],
};
